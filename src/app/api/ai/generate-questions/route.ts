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

  if (section === "READING") {
    return `You are a professional JLPT test creator for level ${level}.
Section: ${section} (Mondai ${mondaiNumber}: ${mondaiTitle || ""}).

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

    // Nhờ có responseSchema, kết quả trả về chắc chắn là JSON hợp lệ
    const questions = JSON.parse(result.response.text());

    // Đảm bảo passageText chỉ có ở câu đầu tiên
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
