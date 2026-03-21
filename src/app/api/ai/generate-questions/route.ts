import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GenerateQuestionsRequest {
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  count: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  testType?: string;
}

// ── Mondai focus mapping (per level / section / mondai) ───────────────────────
const MONDAI_FOCUS: Record<
  GenerateQuestionsRequest["level"],
  Partial<Record<GenerateQuestionsRequest["section"], Record<number, string>>>
> = {
  N5: {
    VOCABULARY: {
      1: "Kanji reading: choose the correct reading (ひらがな) for the given kanji.",
      2: "Orthography: choose the correct kanji/kana spelling for the word.",
      3: "Context vocabulary: choose the most natural word in context.",
      4: "Paraphrase: choose the option with similar meaning.",
    },
  },
  N4: {
    VOCABULARY: {
      1: "Kanji reading: choose the correct reading for basic N4 kanji in daily life context.",
      2: "Orthography: choose the correct written form (kanji/kana).",
      3: "Context vocabulary: choose the word that fits the sentence meaning.",
      4: "Paraphrase: choose a word/phrase with similar meaning.",
      5: "Usage: choose the word whose usage fits the given sentence.",
    },
  },
  N3: {
    VOCABULARY: {
      1: "Kanji: focus on 読み方 of intermediate N3 kanji. Choose the correct reading in kana.",
      2: "Vocabulary meaning (語彙): choose the word with the correct meaning.",
      3: "Choose the most appropriate word to complete the sentence in context.",
      4: "Paraphrase (言い換え): choose the option that has the closest meaning to the underlined phrase.",
      5: "Usage (用法): choose the sentence where the given word/grammar is used correctly.",
    },
  },
  N2: {
    VOCABULARY: {
      1: "Kanji reading: advanced kanji reading questions for N2.",
      2: "Orthography: choose correct written form (kanji/kana) for advanced words.",
      3: "Word formation (語形成): choose the correct derived word or compound.",
      4: "Context vocabulary: choose the best word for the context.",
      5: "Paraphrase of near-synonyms (類義語): subtle differences in meaning.",
      6: "Usage: choose the sentence with correct usage of the given word/expression.",
    },
    GRAMMAR: {
      7: "Sentence grammar 1: choose the correct grammar pattern to complete sentences.",
      8: "Sentence grammar 2: higher difficulty grammar completion.",
    },
  },
  N1: {
    VOCABULARY: {
      1: "Kanji reading: high-level kanji reading for N1.",
      2: "Context vocabulary: choose the best word according to the nuance.",
      3: "Paraphrase / near-synonym (言い換え類義語): subtle nuance differences.",
      4: "Usage: choose the sentence where the advanced word is used correctly.",
    },
    GRAMMAR: {
      5: "Sentence grammar 1: advanced grammar pattern completion.",
      6: "Sentence grammar 2: very difficult grammar discrimination.",
    },
  },
};

// ── Schema ép kiểu JSON output ────────────────────────────────────────────────
const questionSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      contentText: { type: SchemaType.STRING },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      correctOption: { type: SchemaType.NUMBER },
      explanation: { type: SchemaType.STRING },
      passageText: { type: SchemaType.STRING },
    },
    required: [
      "contentText",
      "options",
      "correctOption",
      "explanation",
      "passageText",
    ],
  },
};

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(req: GenerateQuestionsRequest): string {
  const { level, section, count, mondaiNumber, mondaiTitle } = req;

  const focus =
    MONDAI_FOCUS[level]?.[section]?.[mondaiNumber] ??
    (mondaiTitle
      ? `Follow the JLPT ${level} style for "${mondaiTitle}".`
      : "Follow the official JLPT question style for this section and level.");

  if (section === "READING") {
    return `You are a professional JLPT test creator for level ${level}.
Section: ${section} (Mondai ${mondaiNumber}: ${mondaiTitle || ""}).
Focus: ${focus}

Instructions:
- Generate EXACTLY ONE reading passage (about 200-300 characters for N4/N5, 400-600 characters for N2/N3) related to daily life or general topics.
- Generate EXACTLY ${count} questions based ONLY on that passage.
- Language: Japanese for the passage, questions, and options. Vietnamese for the explanations.
- Difficulty: Strictly JLPT ${level} standard.
- MUST put the reading passage in the 'passageText' field of the FIRST question element ONLY. For the remaining questions, use "".
- Ensure all ${count} questions are returned in the JSON array.`;
  }

  return `You are a professional JLPT test creator for level ${level}.
Section: ${section} (Mondai ${mondaiNumber}: ${mondaiTitle || ""}).
Focus: ${focus}

Instructions:
- Generate EXACTLY ${count} questions.
- Language: Japanese for questions/options, Vietnamese for explanations.
- Difficulty: Strictly JLPT ${level} standard.
- 'passageText' MUST be explicitly set to "" for all questions.
- Question style: If Vocabulary, use 【word】. If Grammar, use ＿＿＿.`;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: GenerateQuestionsRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-pro";

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY chưa được cấu hình trong .env.local" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel(
      {
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: questionSchema,
        },
      },
      { apiVersion: "v1beta" },
    );

    const prompt = buildPrompt(body);
    const result = await model.generateContent(prompt);

    const questions = JSON.parse(result.response.text());

    const sanitized = questions.map((q: any, i: number) => ({
      ...q,
      passageText: i === 0 ? q.passageText || "" : "",
    }));

    return NextResponse.json({ questions: sanitized, model: modelName });
  } catch (err: any) {
    console.error("[Gemini AI Error]:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "AI không thể tạo đề vào lúc này. Vui lòng thử lại.",
      },
      { status: 500 },
    );
  }
}
