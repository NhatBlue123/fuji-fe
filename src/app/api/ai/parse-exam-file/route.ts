import { NextRequest, NextResponse } from "next/server";


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ParsedExamQuestion {
  mondaiNumber: number;
  mondaiTitle: string;
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  passageText: string;
  contentText: string;
  options: string[];
  correctOption: number | null;
  explanation: string;
  _rowIndex?: number;
  _error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory parse cache (TTL: 30 min, keyed by file content hash)
// Avoids calling Gemini again if the same file is uploaded twice in a session.
// ─────────────────────────────────────────────────────────────────────────────
const parseCache = new Map<string, { data: any[]; expiresAt: number }>();
const PARSE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getParseCached(key: string) {
  const entry = parseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { parseCache.delete(key); return null; }
  return entry.data;
}

function setParseCached(key: string, data: any[]) {
  if (parseCache.size >= 20) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey !== undefined) parseCache.delete(firstKey);
  }
  parseCache.set(key, { data, expiresAt: Date.now() + PARSE_CACHE_TTL_MS });
}

/** Simple non-crypto hash for a string (djb2). Used as cache key. */
function hashString(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }
  return hash.toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text pre-processing — clean up PDF extraction artifacts before sending to AI
// This significantly reduces token count for typical Japanese PDF text.
// ─────────────────────────────────────────────────────────────────────────────
function preprocessPdfText(raw: string): string {
  return raw
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse multiple blank lines into a single blank line
    .replace(/\n{3,}/g, "\n\n")
    // Remove repeated dashes/underscores used as separators (keep max 3)
    .replace(/[-_＿─]{4,}/g, "───")
    // Collapse runs of spaces (but keep single newlines)
    .replace(/[ \t]{2,}/g, " ")
    // Remove "公众号：…" watermarks commonly found in Chinese/Japanese PDF copies
    .replace(/公[衆众]号[：:：].*$/gm, "")
    .replace(/小红书.*$/gm, "")
    // Trim each line
    .split("\n").map(l => l.trim()).join("\n")
    .trim();
}

/**
 * Extract only the question-relevant portion of the text.
 * Strips the cover page and cuts off after the questions end.
 * Max 14,000 chars (≈ 3,500–4,000 tokens) — enough for a full JLPT N5 paper.
 */
function extractRelevantText(text: string, maxChars = 14000): string {
  // Try to find where questions start (もんだい / 問題 / mондai marker)
  const startMarkers = [/もんだい\s*[１1]/u, /問題\s*[１1]/u, /PART\s+1/i];
  let startIdx = 0;
  for (const marker of startMarkers) {
    const m = text.search(marker);
    if (m > 0 && m < text.length / 2) { startIdx = Math.max(0, m - 50); break; }
  }

  // Cut listening section (音声/audio marker) — it's not parseable from text
  const listeningMarkers = [/聴解|聴力|Listening/u];
  let endIdx = text.length;
  for (const marker of listeningMarkers) {
    const m = text.search(marker);
    if (m > startIdx + 1000) { endIdx = m; break; }
  }

  return text.slice(startIdx, Math.min(endIdx, startIdx + maxChars));
}


// ─────────────────────────────────────────────────────────────────────────────
// Build lean AI prompt
// ─────────────────────────────────────────────────────────────────────────────
function buildParsePrompt(text: string, level: string): string {
  return `Parse JLPT ${level} exam. Return JSON array. Each question:
{mondaiNumber:int, mondaiTitle:string, section:"VOCABULARY"|"GRAMMAR"|"READING"|"LISTENING", passageText:string, contentText:string, options:string[4], correctOption:1|2|3|4|0}

Rules:
- Extract every individual question (not just headers).
- passageText: first question of a reading mondai only; "" for all others.
- correctOption: 0 if answer key not in text.
- Skip instructions, examples, answer-sheet text.
- Star/reorder questions: 4 chunk labels in options; sentence with ★ in contentText.

TEXT:
${text}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler — POST /api/ai/parse-exam-file
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Use Flash model for parsing — it's fast and cheap enough for structured extraction
    const modelName = process.env.GEMINI_PARSE_MODEL || process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY chưa được cấu hình trong biến môi trường." },
        { status: 500 }
      );
    }

    let rawText = "";
    let level = "N5";

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // ── File upload path ──────────────────────────────────────────────────
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      level = (formData.get("level") as string) ?? "N5";

      if (!file) {
        return NextResponse.json({ error: "Không có file được tải lên." }, { status: 400 });
      }
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "File quá lớn. Giới hạn tối đa là 15MB." }, { status: 400 });
      }

      const fileName = file.name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileName.endsWith(".pdf")) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text: string }>;
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const mammoth = require("mammoth") as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> };
          const result = await mammoth.extractRawText({ buffer });
          rawText = result.value;
        } catch {
          return NextResponse.json(
            { error: "Không thể đọc file Word. Cài mammoth (npm install mammoth) hoặc convert sang PDF." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Chỉ hỗ trợ file .pdf, .docx, .doc" },
          { status: 400 }
        );
      }
    } else {
      // ── JSON body path ────────────────────────────────────────────────────
      const body = await req.json();
      rawText = body.rawText ?? "";
      level = body.level ?? "N5";
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Không trích xuất được văn bản. File có thể là ảnh scan hoặc được bảo vệ." },
        { status: 400 }
      );
    }

    // ── Pre-process → extract relevant portion ────────────────────────────────
    const cleaned = preprocessPdfText(rawText);
    const trimmed = extractRelevantText(cleaned);

    // ── Cache check (hash of trimmed text + level) ────────────────────────────
    const cacheKey = `pe:${level}:${hashString(trimmed)}`;
    const cached = getParseCached(cacheKey);
    if (cached) {
      return NextResponse.json({ questions: cached, total: cached.length, valid: cached.filter((q: any) => !q._error).length, invalid: cached.filter((q: any) => q._error).length, cached: true });
    }

    const prompt = buildParsePrompt(trimmed, level);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });
    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      throw new Error(geminiData?.error?.message ?? `Gemini API error ${geminiRes.status}`);
    }
    let text = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as string;
    // Robust extraction: find the first '[' and last ']' since the result must be an array
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    } else {
      // Fallback: strip markdown blocks just in case
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    }

    let questions: any[] = [];
    try {
      questions = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI trả về dữ liệu không hợp lệ. Hãy thử lại.", rawResponse: text.slice(0, 200) },
        { status: 500 }
      );
    }

    // ── Validate + normalize ──────────────────────────────────────────────────
    const processed = questions.map((q, idx) => {
      const errors: string[] = [];
      if (!q.contentText?.trim()) errors.push("Thiếu nội dung câu hỏi");
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push("Thiếu đáp án");
      return {
        ...q,
        _rowIndex: idx + 1,
        _error: errors.length > 0 ? errors.join("; ") : undefined,
        explanation: "",
        passageText: q.passageText ?? "",
        correctOption: !q.correctOption || q.correctOption === 0 ? null : q.correctOption,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["", "", "", ""],
      };
    });

    // ── Cache result ──────────────────────────────────────────────────────────
    setParseCached(cacheKey, processed);

    const validCount = processed.filter(q => !q._error).length;
    return NextResponse.json({
      questions: processed,
      total: processed.length,
      valid: validCount,
      invalid: processed.length - validCount,
    });
  } catch (err: any) {
    console.error("[parse-exam-file] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Lỗi server không xác định." },
      { status: 500 }
    );
  }
}
