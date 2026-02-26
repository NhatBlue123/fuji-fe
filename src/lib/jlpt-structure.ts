/**
 * JLPT Structure Config
 *
 * Frontend-only static definition of JLPT exam structure per level.
 * Purpose: render empty question slots and know audio/passage requirements.
 * Backend is the source of truth for saved question content.
 *
 * N3, N4, N5 → 3 sections
 * N1, N2     → 2 sections
 */

export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";
export type SectionKey = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

export interface MondaiConfig {
  number: number;       // mondaiNumber stored in DB
  title: string;        // display title
  start: number;        // start question_order (child question)
  end: number;          // end question_order (inclusive)
  requires_passage: boolean;
  requires_audio: boolean;
  instruction?: string; // Official JLPT direction text shown above questions
}

export interface SectionConfig {
  name: string;         // display name
  sectionKeys: SectionKey[];   // backend section enum values this covers
  mondai: MondaiConfig[];
}

/**
 * Rebuild a level's structure using custom question counts per mondai.
 * @param level  JLPT level key
 * @param counts Record<mondaiNumber, questionCount> — overrides from admin config
 * @returns New sections array with recalculated start/end
 */
export function rebuildStructureWithCounts(
  level: JLPTLevel,
  counts: Record<number, number>
): SectionConfig[] {
  const base = JLPT_STRUCTURE[level];
  let cursor = 1;
  return base.map((section) => ({
    ...section,
    mondai: section.mondai.map((m) => {
      const count = counts[m.number] ?? (m.end - m.start + 1);
      const start = cursor;
      const end = cursor + count - 1;
      cursor = end + 1;
      return { ...m, start, end };
    }),
  }));
}

export const JLPT_STRUCTURE: Record<JLPTLevel, SectionConfig[]> = {
  // ─────────────────────────────────────────────────────────────
  // N5 — 3 sections, ~110 questions
  // ─────────────────────────────────────────────────────────────
  N5: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 12, requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 13, end: 20, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 21, end: 25, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 26, end: 30, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 5, title: "文の文法①", start: 31, end: 40, requires_passage: false, requires_audio: false },
        { number: 6, title: "文の文法②", start: 41, end: 45, requires_passage: false, requires_audio: false },
        { number: 7, title: "短い読解",  start: 46, end: 50, requires_passage: true,  requires_audio: false },
        { number: 8, title: "中読解①",  start: 51, end: 55, requires_passage: true,  requires_audio: false },
        { number: 9, title: "情報検索",  start: 56, end: 60, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 10, title: "課題理解", start: 61, end: 73, requires_passage: false, requires_audio: true },
        { number: 11, title: "ポイント理解", start: 74, end: 80, requires_passage: false, requires_audio: true },
        { number: 12, title: "発話表現", start: 81, end: 90, requires_passage: false, requires_audio: true },
        { number: 13, title: "即時応答", start: 91, end: 100, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N4 — 3 sections
  // ─────────────────────────────────────────────────────────────
  N4: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 9,  requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 10, end: 18, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 19, end: 23, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 24, end: 28, requires_passage: false, requires_audio: false },
        { number: 5, title: "用法",     start: 29, end: 33, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6, title: "文の文法①", start: 34, end: 48, requires_passage: false, requires_audio: false },
        { number: 7, title: "文の文法②", start: 49, end: 53, requires_passage: false, requires_audio: false },
        { number: 8, title: "短い読解",  start: 54, end: 58, requires_passage: true,  requires_audio: false },
        { number: 9, title: "中読解",    start: 59, end: 63, requires_passage: true,  requires_audio: false },
        { number: 10, title: "情報検索", start: 64, end: 69, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 11, title: "課題理解",    start: 70, end: 77, requires_passage: false, requires_audio: true },
        { number: 12, title: "ポイント理解", start: 78, end: 85, requires_passage: false, requires_audio: true },
        { number: 13, title: "発話表現",    start: 86, end: 92, requires_passage: false, requires_audio: true },
        { number: 14, title: "即時応答",    start: 93, end: 100, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N3 — 3 sections, ~95 questions
  // ─────────────────────────────────────────────────────────────
  N3: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 8,  requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 9,  end: 13, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 14, end: 22, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 23, end: 27, requires_passage: false, requires_audio: false },
        { number: 5, title: "用法",     start: 28, end: 32, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①",    start: 33, end: 45, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②",    start: 46, end: 50, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",     start: 51, end: 58, requires_passage: true,  requires_audio: false },
        { number: 9,  title: "中読解①",     start: 59, end: 64, requires_passage: true,  requires_audio: false },
        { number: 10, title: "中読解②",     start: 65, end: 70, requires_passage: true,  requires_audio: false },
        { number: 11, title: "情報検索",     start: 71, end: 75, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 76, end: 82, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 83, end: 88, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 89, end: 92, requires_passage: false, requires_audio: true },
        { number: 15, title: "発話表現",    start: 93, end: 95, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N2 — 2 sections, ~105 questions
  // ─────────────────────────────────────────────────────────────
  N2: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",        start: 1,  end: 5,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",            start: 6,  end: 10, requires_passage: false, requires_audio: false },
        { number: 3,  title: "語形成",          start: 11, end: 15, requires_passage: false, requires_audio: false },
        { number: 4,  title: "文脈規定",        start: 16, end: 22, requires_passage: false, requires_audio: false },
        { number: 5,  title: "言い換え類義",    start: 23, end: 27, requires_passage: false, requires_audio: false },
        { number: 6,  title: "用法",            start: 28, end: 32, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法①",      start: 33, end: 44, requires_passage: false, requires_audio: false },
        { number: 8,  title: "文の文法②",      start: 45, end: 49, requires_passage: false, requires_audio: false },
        { number: 9,  title: "短い読解",        start: 50, end: 58, requires_passage: true,  requires_audio: false },
        { number: 10, title: "中読解",          start: 59, end: 64, requires_passage: true,  requires_audio: false },
        { number: 11, title: "長い読解",        start: 65, end: 69, requires_passage: true,  requires_audio: false },
        { number: 12, title: "統合理解",        start: 70, end: 74, requires_passage: true,  requires_audio: false },
        { number: 13, title: "情報検索",        start: 75, end: 80, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 14, title: "課題理解",    start: 81, end: 86, requires_passage: false, requires_audio: true },
        { number: 15, title: "ポイント理解", start: 87, end: 91, requires_passage: false, requires_audio: true },
        { number: 16, title: "概要理解",    start: 92, end: 95, requires_passage: false, requires_audio: true },
        { number: 17, title: "即時応答",    start: 96, end: 105, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N1 — 2 sections, ~110 questions
  // ─────────────────────────────────────────────────────────────
  N1: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",      start: 1,  end: 6,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "文脈規定",      start: 7,  end: 13, requires_passage: false, requires_audio: false },
        { number: 3,  title: "言い換え類義",  start: 14, end: 18, requires_passage: false, requires_audio: false },
        { number: 4,  title: "用法",          start: 19, end: 23, requires_passage: false, requires_audio: false },
        { number: 5,  title: "文の文法①",    start: 24, end: 33, requires_passage: false, requires_audio: false },
        { number: 6,  title: "文の文法②",    start: 34, end: 38, requires_passage: false, requires_audio: false },
        { number: 7,  title: "短い読解",      start: 39, end: 47, requires_passage: true,  requires_audio: false },
        { number: 8,  title: "中読解",        start: 48, end: 53, requires_passage: true,  requires_audio: false },
        { number: 9,  title: "長い読解",      start: 54, end: 58, requires_passage: true,  requires_audio: false },
        { number: 10, title: "統合理解",      start: 59, end: 64, requires_passage: true,  requires_audio: false },
        { number: 11, title: "情報検索",      start: 65, end: 70, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",     start: 71, end: 76, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解",  start: 77, end: 83, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",     start: 84, end: 88, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",     start: 89, end: 99, requires_passage: false, requires_audio: true },
        { number: 16, title: "統合理解",     start: 100, end: 106, requires_passage: false, requires_audio: true },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────

/** Find which mondai a given question number belongs to */
export function findMondaiForQuestion(
  level: JLPTLevel,
  questionNumber: number
): { section: SectionConfig; mondai: MondaiConfig } | null {
  const sections = JLPT_STRUCTURE[level];
  for (const section of sections) {
    for (const mondai of section.mondai) {
      if (questionNumber >= mondai.start && questionNumber <= mondai.end) {
        return { section, mondai };
      }
    }
  }
  return null;
}

/** Get all question numbers for a mondai group */
export function getQuestionNumbers(mondai: MondaiConfig): number[] {
  return Array.from({ length: mondai.end - mondai.start + 1 }, (_, i) => mondai.start + i);
}
