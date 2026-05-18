import { NextRequest, NextResponse } from "next/server";

interface MondaiSpec {
  section: string;
  mondaiNumber: number;
  mondaiTitle: string;
  count: number;
  requires_passage: boolean;
}

interface BatchRequest {
  level: string;
  testType?: string;
  sections: MondaiSpec[];
}

// ── In-memory batch cache (TTL 10 min) ───────────────────────────────────────
const batchCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000;
function getBatchCached(key: string) {
  const e = batchCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { batchCache.delete(key); return null; }
  return e.data;
}
function setBatchCache(key: string, data: any) {
  if (batchCache.size >= 20) batchCache.delete(batchCache.keys().next().value!);
  batchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ── Mondai focus map ──────────────────────────────────────────────────────────
const FOCUS: Record<string, Record<string, Record<number, string>>> = {
  N5: {
    VOCABULARY: {
      1: "漢字読み: hiragana reading for underlined N5 kanji.",
      2: "表記: correct kanji/kana spelling for given hiragana.",
      3: "文脈規定: best N5 word for the blank in context.",
      4: "言い換え類義: closest meaning to underlined word.",
    },
    GRAMMAR: {
      5: "文の文法①: correct particle/verb/N5 grammar pattern (〜たい, 〜てください).",
      6: "文の文法②: rearrange ア・イ・ウ・エ into correct order; mark ★ position.",
    },
    READING: {
      7: "短い読解: short passage ~100-150 chars + 1 comprehension question.",
      8: "中読解: medium passage ~200-250 chars + 2 questions.",
      9: "情報検索: simple notice/sign ~150 chars + 1 specific-info question.",
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
      6: "文の文法①: correct N4 pattern (〜ているところ, 〜ようにする, 〜てしまう, 〜ながら, 〜ために).",
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
      6: "文の文法①: correct N3 pattern (〜ところだ, 〜べきだ, 〜はずだ, 〜わけだ).",
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
      3: "語形成: derived word using 〜化,〜的,〜性,非〜,不〜.",
      4: "文脈規定: best N2 word by nuance.",
      5: "言い換え類義: subtle N2 near-synonym differences.",
      6: "用法: correct N2 word/expression usage.",
    },
    GRAMMAR: {
      7: "文の文法①: correct N2 expression (〜にかかわらず, 〜に反して, 〜を通じて).",
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
      5: "文の文法①: correct N1 pattern (〜いかんによらず, 〜をおいて, 〜てやまない).",
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

function buildBatchPrompt(level: string, specs: MondaiSpec[]): string {
  const parts = specs.map((m) => {
    const focus = FOCUS[level]?.[m.section]?.[m.mondaiNumber]
      ?? `JLPT ${level} ${m.section} Mondai ${m.mondaiNumber}: ${m.mondaiTitle}.`;
    const contentRule = m.section === "LISTENING"
      ? ' passageText="" for all. Include listeningScript on every question.'
      : m.requires_passage
        ? " Set passageText on FIRST question only."
        : ' passageText="" for all.';
    return `- Mondai ${m.mondaiNumber} (${m.section}): ${focus} Generate EXACTLY ${m.count} question(s).${contentRule}`;
  }).join("\n");

  return `You are a JLPT ${level} test creator. Generate questions for ALL mondai listed below.

Return a valid JSON array. Each element:
{
  "mondaiNumber": 1,
  "section": "VOCABULARY",
  "questions": [
    {
      "contentText": "question text",
      "options": ["opt1","opt2","opt3","opt4"],
      "correctOption": 1,
      "explanation": "Vietnamese explanation",
      "passageText": "",
      "listeningScript": ""
    }
  ]
}

Rules:
- Japanese for questions/options/passages. Vietnamese for explanations.
- JLPT ${level} difficulty strictly.
- Reordering mondai (文の文法②): 4 chunks ア・イ・ウ・エ in options; options are orderings like "ア→ウ→イ→エ"; mark ★ in contentText.
- VOCABULARY: use 【word】 to mark the target word.
- LISTENING: contentText is the short visible question only. Put the full Japanese audio transcript/dialogue in listeningScript. Do not put the full transcript in contentText.

Mondai list:
${parts}`;
}

// ── Helper: call Gemini REST API v1beta ───────────────────────────────────────
async function callGemini(apiKey: string, model: string, prompt: string, maxTokens = 16384) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini API error ${res.status}`);
  let text = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as string;
  // Strip markdown JSON block if present
  text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return text;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình." }, { status: 500 });
    }

    const body: BatchRequest = await req.json();
    const { level, sections } = body;

    if (!sections?.length) {
      return NextResponse.json({ error: "sections is required." }, { status: 400 });
    }

    // Cache check
    const cacheKey = `batch:${level}:${sections.map(s => `${s.section}${s.mondaiNumber}x${s.count}`).join(",")}`;
    const cached = getBatchCached(cacheKey);
    if (cached) {
      return NextResponse.json({ results: cached, cached: true });
    }

    const prompt = buildBatchPrompt(level, sections);

    const text = await callGemini(apiKey, model, prompt, 16384);

    let parsed: any[];
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[AI/batch] Bad JSON:", text.slice(0, 300));
      return NextResponse.json({ error: "AI trả về JSON không hợp lệ. Hãy thử lại." }, { status: 500 });
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "AI không trả về danh sách. Hãy thử lại." }, { status: 500 });
    }

    const sanitized = parsed.map((result: any) => ({
      ...result,
      questions: Array.isArray(result?.questions)
        ? result.questions.map((question: any, index: number) => ({
            ...question,
            correctOption:
              typeof question?.correctOption === "number" &&
              question.correctOption >= 1 &&
              question.correctOption <= 4
                ? question.correctOption
                : 1,
            passageText: index === 0 ? (question?.passageText || "") : "",
            listeningScript:
              result?.section === "LISTENING"
                ? String(question?.listeningScript || question?.script || "").trim()
                : undefined,
          }))
        : [],
    }));

    setBatchCache(cacheKey, sanitized);
    return NextResponse.json({ results: sanitized });
  } catch (err: any) {
    console.error("[AI/batch] error:", err);
    return NextResponse.json({ error: err?.message ?? "AI không thể tạo câu hỏi. Vui lòng thử lại." }, { status: 500 });
  }
}
