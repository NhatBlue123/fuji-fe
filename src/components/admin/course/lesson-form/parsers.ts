import type {
  MultipleChoiceQuestion,
  FillBlankItem,
  MatchingItem,
  ListeningQuestion,
  TaskType,
} from "./types";

// ─── Parse Multi-add text ──────────────────────────────

export function parseMultipleChoice(
  text: string,
  startIdx: number,
): MultipleChoiceQuestion[] {
  const questions: MultipleChoiceQuestion[] = [];
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const questionLine = lines.find(
      (l) => l.startsWith("Q:") || l.startsWith("q:"),
    );
    const answerLine = lines.find((l) => l.toLowerCase().startsWith("answer:"));
    const explanationLine = lines.find((l) =>
      l.toLowerCase().startsWith("explanation:"),
    );
    const optionLines = lines.filter((l) => /^[A-Za-z]\)/.test(l));

    if (questionLine && optionLines.length > 0) {
      const question = questionLine.replace(/^[Qq]:\s*/, "");
      const options = optionLines
        .map((opt) => {
          const match = opt.match(/^([A-Za-z])\)\s*(.+)$/);
          return match ? { key: match[1].toUpperCase(), text: match[2] } : null;
        })
        .filter(Boolean) as { key: string; text: string }[];

      const answer = answerLine
        ? answerLine
            .replace(/^answer:\s*/i, "")
            .trim()
            .toUpperCase()
        : "";
      const explanation = explanationLine
        ? explanationLine.replace(/^explanation:\s*/i, "").trim()
        : "";

      questions.push({
        id: `q${startIdx + idx + 1}`,
        question,
        options,
        answer,
        explanation,
      });
    }
  });

  return questions;
}

export function parseFillBlank(
  text: string,
  startIdx: number,
): FillBlankItem[] {
  const items: FillBlankItem[] = [];
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const sentenceLine = lines[0];
    const hintLines = lines.filter((l) => l.toLowerCase().startsWith("hint:"));

    const match = sentenceLine.match(/（(.+?)）/);
    if (match) {
      const answer = match[1];
      const sentence = sentenceLine;
      const hints = hintLines.map((h) => h.replace(/^hint:\s*/i, ""));

      items.push({
        id: `q${startIdx + idx + 1}`,
        sentence,
        answer,
        hints,
      });
    }
  });

  return items;
}

export function parseMatching(text: string): MatchingItem[] {
  const items: MatchingItem[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  lines.forEach((line) => {
    const match = line.match(/^(.+?)\s*[-=]>\s*(.+)$/);
    if (match) {
      items.push({ left: match[1].trim(), right: match[2].trim() });
    }
  });

  return items;
}

export function parseListening(
  text: string,
  startIdx: number,
): ListeningQuestion[] {
  const questions: ListeningQuestion[] = [];
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const questionLine = lines.find(
      (l) => l.startsWith("Q:") || l.startsWith("q:"),
    );
    const answerLine = lines.find((l) => l.toLowerCase().startsWith("answer:"));
    const optionLines = lines.filter((l) => /^[A-Za-z]\)/.test(l));

    if (questionLine && optionLines.length > 0) {
      const question = questionLine.replace(/^[Qq]:\s*/, "");
      const options = optionLines
        .map((opt) => {
          const match = opt.match(/^([A-Za-z])\)\s*(.+)$/);
          return match ? { key: match[1].toUpperCase(), text: match[2] } : null;
        })
        .filter(Boolean) as { key: string; text: string }[];

      const answer = answerLine
        ? answerLine
            .replace(/^answer:\s*/i, "")
            .trim()
            .toUpperCase()
        : "";

      questions.push({
        id: `q${startIdx + idx + 1}`,
        question,
        options,
        answer,
      });
    }
  });

  return questions;
}

export function getMultiAddFormat(taskType: TaskType): string {
  if (taskType === "multiple_choice") {
    return `Q: Chọn nghĩa đúng của từ 「行きます」
A) Ăn
B) Đi
C) Uống
D) Nghe
Answer: B
Explanation: 「行きます」 nghĩa là đi

Q: Chọn cách đọc đúng của từ 「見ます」
A) みます
B) きます
C) よみます
Answer: A
Explanation: 「見ます」 đọc là みます`;
  } else if (taskType === "fill_blank") {
    return `まどを（あけて）ください。
Hint: Động từ: mở
Hint: Từ gốc: あけます

ここに名前を（かいて）ください。
Hint: Động từ: viết
Hint: Từ gốc: かきます`;
  } else if (taskType === "matching") {
    return `いぬ -> Con chó
ねこ -> Con mèo
とり -> Con chim
さかな -> Con cá`;
  } else if (taskType === "listening") {
    return `Q: Người nói sẽ đi đâu?
A) Siêu thị
B) Thư viện
C) Trường học
Answer: B

Q: Người nói muốn làm gì?
A) Đọc sách
B) Mua đồ
C) Ăn cơm
Answer: A`;
  }
  return "";
}
