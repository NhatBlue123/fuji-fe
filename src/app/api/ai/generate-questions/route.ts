import { NextRequest, NextResponse } from "next/server";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GenerateQuestionsRequest {
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  count: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  testType?: string;
  topic?: string;
}

// ── In-memory cache (TTL 10 min) ─────────────────────────────────────────────
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000;
function getCached(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { cache.delete(key); return null; }
  return e.data;
}
function setCache(key: string, data: any) {
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ── Mondai focus (1 entry per mondai) ─────────────────────────────────────────
const MONDAI_FOCUS: Record<string, Record<string, Record<number, string>>> = {
  N5: {
    VOCABULARY: {
      1: "漢字読み: choose the correct hiragana reading for the underlined N5 kanji word.",
      2: "表記: choose the correct kanji/kana spelling for the given hiragana word.",
      3: "文脈規定: choose the most natural N5-level word to fill in the blank.",
      4: "言い換え類義: choose the option with the closest meaning to the underlined word.",
    },
    GRAMMAR: {
      5: "文の文法①: choose the correct particle/verb/N5 grammar pattern (〜たい, 〜てください, 〜ましょう).",
      6: "文の文法②: rearrange 4 chunks ア・イ・ウ・エ into correct order. Mark ★ position.",
    },
    READING: {
      7: "短い読解: write a short passage ~100-150 chars + 1 comprehension question.",
      8: "中読解: write a medium passage ~200-250 chars + 2 comprehension questions.",
      9: "情報検索: write a simple notice/sign ~150 chars + 1 specific-info question.",
    },
  },
  N4: {
    VOCABULARY: {
      1: "漢字読み: reading for N4 kanji in daily-life context.",
      2: "表記: correct written form for given pronunciation.",
      3: "文脈規定: word fitting the N4 sentence meaning.",
      4: "言い換え類義: word/phrase with similar meaning.",
      5: "用法: sentence where the N4 word is used correctly.",
    },
    GRAMMAR: {
      6: "文の文法①: correct N4 pattern (〜ているところ, 〜ようにする, 〜てしまう, 〜ながら, 〜ために, 〜らしい).",
      7: "文の文法②: rearrange ア・イ・ウ・エ; mark ★. N4 level.",
    },
    READING: {
      8:  "短い読解: passage ~150-200 chars + 2 questions.",
      9:  "中読解: passage ~300-350 chars + 3 questions.",
      10: "情報検索: announcement ~200 chars + 1-2 questions.",
    },
  },
  N3: {
    VOCABULARY: {
      1: "漢字読み: kana reading for N3 kanji compounds.",
      2: "表記: correct written form for N3 words.",
      3: "文脈規定: most appropriate N3 word in context.",
      4: "言い換え類義: closest meaning to underlined N3 phrase.",
      5: "用法: sentence with correct N3 word usage.",
    },
    GRAMMAR: {
      6: "文の文法①: correct N3 pattern (〜ところだ, 〜べきだ, 〜はずだ, 〜わけだ, 〜にしては).",
      7: "文の文法②: rearrange ア・イ・ウ・エ; mark ★. N3 level.",
    },
    READING: {
      8:  "短い読解: 2 short passages ~150-200 chars each; 2 questions each = 4 total.",
      9:  "中読解①: passage ~350-400 chars + 3 questions.",
      10: "中読解②: passage ~400 chars + 2-3 questions.",
      11: "情報検索: flyer/FAQ ~200-250 chars + 2 questions.",
    },
  },
  N2: {
    VOCABULARY: {
      1: "漢字読み: advanced N2 kanji reading.",
      2: "表記: correct form for advanced N2 vocabulary.",
      3: "語形成: derived word using 〜化, 〜的, 〜性, 非〜, 不〜.",
      4: "文脈規定: best N2 word by nuance.",
      5: "言い換え類義: subtle N2 near-synonym differences.",
      6: "用法: correct N2 word/expression usage.",
    },
    GRAMMAR: {
      7: "文の文法①: correct N2 expression (〜にかかわらず, 〜に反して, 〜を通じて, 〜に際して).",
      8: "文の文法②: rearrange ア・イ・ウ・エ; mark ★. N2 level.",
    },
    READING: {
      9:  "短い読解: 3 short passages ~200-250 chars; 2-3 questions each. Flat list.",
      10: "中読解: passage ~500 chars + 3 analytical questions.",
      11: "長い読解: passage ~600-700 chars + 4 questions including inference.",
      12: "統合理解: 2 contrasting passages ~300 chars each + 3 comparison questions.",
      13: "情報検索: detailed document ~300 chars + 2-3 questions.",
    },
  },
  N1: {
    VOCABULARY: {
      1: "漢字読み: high-level N1 kanji, rare readings.",
      2: "文脈規定: best advanced N1 word by precise nuance.",
      3: "言い換え類義: subtle N1 near-synonym differences.",
      4: "用法: correct advanced N1 word usage.",
    },
    GRAMMAR: {
      5: "文の文法①: correct N1 pattern (〜いかんによらず, 〜をおいて, 〜てやまない, 〜ともなると).",
      6: "文の文法②: rearrange ア・イ・ウ・エ; mark ★. N1 formal level.",
    },
    READING: {
      7:  "短い読解: 3 short passages ~250 chars; 3 inference questions each. Flat list.",
      8:  "中読解: passage ~550 chars + 3 questions on writer's logic.",
      9:  "長い読解: passage ~700-800 chars + 4 deep-comprehension questions.",
      10: "統合理解: 2 contrasting essays ~350 chars each + 3-4 comparison questions.",
      11: "情報検索: complex professional document ~350 chars + 2-3 questions.",
    },
  },
};

function getReadingPassageHint(mondaiTitle: string): string {
  if (/短い/.test(mondaiTitle)) return "short (100–250 chars)";
  if (/中読解/.test(mondaiTitle)) return "medium (300–500 chars)";
  if (/長い/.test(mondaiTitle)) return "long (600–800 chars)";
  if (/統合/.test(mondaiTitle)) return "two contrasting passages (~300 chars each)";
  if (/情報検索/.test(mondaiTitle)) return "practical document with structured data (200–350 chars)";
  return "appropriate length for the level";
}

function buildPrompt(req: GenerateQuestionsRequest): string {
  const { level, section, count, mondaiNumber, mondaiTitle, topic } = req;
  const topicLine = topic?.trim()
    ? `- Topic/Theme: "${topic.trim()}" — All questions MUST relate to this topic.`
    : "";
  const focus =
    MONDAI_FOCUS[level]?.[section]?.[mondaiNumber] ??
    (mondaiTitle ? `JLPT ${level} style for "${mondaiTitle}".` : `Standard JLPT ${level} ${section} question.`);

  const jsonFormat = `Return a valid JSON array. Each element:
{
  "contentText": "question text",
  "options": ["option1","option2","option3","option4"],
  "correctOption": 1,
  "explanation": "Vietnamese explanation",
  "passageText": ""
}`;

  if (section === "READING") {
    const sizeHint = mondaiTitle ? getReadingPassageHint(mondaiTitle) : "appropriate length";
    return `JLPT ${level} test creator. READING Mondai ${mondaiNumber}${mondaiTitle ? `: ${mondaiTitle}` : ""}.
Task: ${focus}
- Passage length: ${sizeHint}.
${topicLine}
- Generate EXACTLY ${count} questions from the passage.
- Japanese for passage/questions/options. Vietnamese for explanations only.
- JLPT ${level} difficulty.
- passageText: set ONLY on the FIRST question element. Leave "" for all others.
- 統合理解: both passages in first passageText separated by 【A】 and 【B】.
${jsonFormat}`;
  }

  if (section === "GRAMMAR") {
    const isReorder = /文の文法②|文章の文法/.test(mondaiTitle || "");
    return `JLPT ${level} test creator. GRAMMAR Mondai ${mondaiNumber}${mondaiTitle ? `: ${mondaiTitle}` : ""}.
Task: ${focus}
- Generate EXACTLY ${count} questions. Japanese for questions/options. Vietnamese for explanations.
- JLPT ${level} difficulty. passageText MUST be "" for all.
${topicLine}
${isReorder
  ? "- Reordering: 4 chunks ア・イ・ウ・エ in question. Options are orderings like ア→ウ→イ→エ. Mark ★ in contentText."
  : "- Use ＿＿＿ as blank. Options are grammar patterns or conjugated forms."}
${jsonFormat}`;
  }

  return `JLPT ${level} test creator. ${section} Mondai ${mondaiNumber}${mondaiTitle ? `: ${mondaiTitle}` : ""}.
Focus: ${focus}
- Generate EXACTLY ${count} questions. Japanese for questions/options. Vietnamese for explanations.
- JLPT ${level} difficulty. passageText MUST be "" for all.
${topicLine}
- VOCABULARY: use 【word】 to mark the target word.
${jsonFormat}`;
}

// ── Helper: call Gemini REST API v1beta ───────────────────────────────────────
async function callGemini(apiKey: string, model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `Gemini API error ${res.status}`;
    throw new Error(msg);
  }
  let rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // ── Robust JSON extraction ─────────────────────────────────────────────────
  // Strategy 1: Find first '[' and last ']' (valid array)
  const extractJson = (text: string): string | null => {
    // Remove markdown code fences first
    let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    // Try direct parse
    try { JSON.parse(cleaned); return cleaned; } catch {}

    // Try array extraction
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = cleaned.substring(start, end + 1);
      try { JSON.parse(candidate); return candidate; } catch {}
    }

    // Try object extraction (single question wrapper)
    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      const candidate = cleaned.substring(objStart, objEnd + 1);
      try { JSON.parse(candidate); return `[${candidate}]`; } catch {}
    }

    // Strip leading/trailing noise
    cleaned = cleaned.replace(/^[^\[{]+/, "").replace(/[^}\]]+$/, "");
    try { JSON.parse(cleaned); return cleaned; } catch {}

    return null;
  };

  const extracted = extractJson(rawText);
  if (!extracted) {
    console.error("[AI/generate-questions] Failed to extract JSON. Raw response:", rawText.slice(0, 1000));
    throw new Error("AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
  }

  return extracted;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: GenerateQuestionsRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình trong .env.local" }, { status: 500 });
    }

    // Cache check
    const cacheKey = `gq:${body.level}:${body.section}:${body.mondaiNumber}:${body.count}:${body.topic ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[AI/generate-questions] Cache HIT (${cacheKey})`);
      return NextResponse.json({ questions: cached, model: `${model} (cached)` });
    }

    const prompt = buildPrompt(body);
    console.log(`[AI/generate-questions] Calling Gemini REST v1 (${model}), prompt=${prompt.length}chars`);

    const text = await callGemini(apiKey, model, prompt);

    let questions: any[];
    try {
      questions = JSON.parse(text);
    } catch (parseErr) {
      console.error("[AI/generate-questions] JSON parse FAILED. Raw text:", text.slice(0, 2000));
      return NextResponse.json({ error: "AI trả về JSON không hợp lệ. Hãy thử lại." }, { status: 500 });
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "AI không trả về danh sách câu hỏi. Hãy thử lại." }, { status: 500 });
    }

    const sanitized = questions.map((q: any, i: number) => ({
      ...q,
      passageText: i === 0 ? (q.passageText || "") : "",
    }));

    setCache(cacheKey, sanitized);
    return NextResponse.json({ questions: sanitized, model });
  } catch (err: any) {
    console.error("[AI/generate-questions] error:", err);
    return NextResponse.json({ error: err?.message || "AI không thể tạo đề. Vui lòng thử lại." }, { status: 500 });
  }
}
