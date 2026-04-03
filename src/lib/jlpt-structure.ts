/**
 * JLPT Structure Config
 *
 * Frontend-only static definition of JLPT exam structure per level.
 * Purpose: render empty question slots and know audio/passage requirements.
 * Backend is the source of truth for saved question content.
 *
 * N3, N4, N5 → 3 sections
 * N1, N2     → 2 sections
 *
 * Question counts are based on official JLPT exam format (JLPT Spec Sheet).
 */

export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";
export type SectionKey = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
export type TestType = "full_test" | "vocabulary" | "grammar_reading" | "listening";

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
  // N5 — 3 sections, ~84 questions
  // Vocab: 問1–4  (30q), Grammar+Reading: 問5–9  (24q), Listening: 問10–13 (24q)
  // ─────────────────────────────────────────────────────────────
  N5: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 9,  requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 10, end: 15, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 16, end: 25, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 26, end: 30, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 5, title: "文の文法①", start: 31, end: 46, requires_passage: false, requires_audio: false },
        { number: 6, title: "文の文法②", start: 47, end: 51, requires_passage: false, requires_audio: false },
        { number: 7, title: "短い読解",  start: 52, end: 55, requires_passage: true,  requires_audio: false },
        { number: 8, title: "中読解",    start: 56, end: 61, requires_passage: true,  requires_audio: false },
        { number: 9, title: "情報検索",  start: 62, end: 65, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 10, title: "課題理解",    start: 66, end: 72, requires_passage: false, requires_audio: true },
        { number: 11, title: "ポイント理解", start: 73, end: 78, requires_passage: false, requires_audio: true },
        { number: 12, title: "発話表現",    start: 79, end: 83, requires_passage: false, requires_audio: true },
        { number: 13, title: "即時応答",    start: 84, end: 89, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N4 — 3 sections, ~94 questions
  // Vocab: 問1–5 (33q), Grammar+Reading: 問6–10 (33q), Listening: 問11–14 (28q)
  // ─────────────────────────────────────────────────────────────
  N4: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 7,  requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 8,  end: 13, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 14, end: 23, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 24, end: 28, requires_passage: false, requires_audio: false },
        { number: 5, title: "用法",     start: 29, end: 33, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①", start: 34, end: 48, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②", start: 49, end: 53, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",  start: 54, end: 57, requires_passage: true,  requires_audio: false },
        { number: 9,  title: "中読解",    start: 58, end: 63, requires_passage: true,  requires_audio: false },
        { number: 10, title: "情報検索",  start: 64, end: 66, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 11, title: "課題理解",    start: 67, end: 74, requires_passage: false, requires_audio: true },
        { number: 12, title: "ポイント理解", start: 75, end: 81, requires_passage: false, requires_audio: true },
        { number: 13, title: "発話表現",    start: 82, end: 86, requires_passage: false, requires_audio: true },
        { number: 14, title: "即時応答",    start: 87, end: 94, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N3 — 3 sections, ~94 questions
  // Vocab: 問1–5 (35q), Grammar+Reading: 問6–11 (37q), Listening: 問12–15 (22q)
  // ─────────────────────────────────────────────────────────────
  N3: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1, title: "漢字読み", start: 1,  end: 8,  requires_passage: false, requires_audio: false },
        { number: 2, title: "表記",     start: 9,  end: 14, requires_passage: false, requires_audio: false },
        { number: 3, title: "文脈規定", start: 15, end: 25, requires_passage: false, requires_audio: false },
        { number: 4, title: "言い換え", start: 26, end: 30, requires_passage: false, requires_audio: false },
        { number: 5, title: "用法",     start: 31, end: 35, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①", start: 36, end: 48, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②", start: 49, end: 53, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",  start: 54, end: 59, requires_passage: true,  requires_audio: false },
        { number: 9,  title: "中読解①",  start: 60, end: 65, requires_passage: true,  requires_audio: false },
        { number: 10, title: "中読解②",  start: 66, end: 69, requires_passage: true,  requires_audio: false },
        { number: 11, title: "情報検索",  start: 70, end: 72, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 73, end: 78, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 79, end: 84, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 85, end: 87, requires_passage: false, requires_audio: true },
        { number: 15, title: "発話表現",    start: 88, end: 94, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N2 — 2 sections, ~105 questions
  // Lang+Reading: 問1–13 (80q), Listening: 問14–17 (25q)
  // ─────────────────────────────────────────────────────────────
  N2: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",     start: 1,  end: 5,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",          start: 6,  end: 10, requires_passage: false, requires_audio: false },
        { number: 3,  title: "語形成",        start: 11, end: 15, requires_passage: false, requires_audio: false },
        { number: 4,  title: "文脈規定",      start: 16, end: 22, requires_passage: false, requires_audio: false },
        { number: 5,  title: "言い換え類義",  start: 23, end: 27, requires_passage: false, requires_audio: false },
        { number: 6,  title: "用法",          start: 28, end: 32, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法①",    start: 33, end: 44, requires_passage: false, requires_audio: false },
        { number: 8,  title: "文の文法②",    start: 45, end: 49, requires_passage: false, requires_audio: false },
        { number: 9,  title: "短い読解",      start: 50, end: 58, requires_passage: true,  requires_audio: false },
        { number: 10, title: "中読解",        start: 59, end: 64, requires_passage: true,  requires_audio: false },
        { number: 11, title: "長い読解",      start: 65, end: 69, requires_passage: true,  requires_audio: false },
        { number: 12, title: "統合理解",      start: 70, end: 74, requires_passage: true,  requires_audio: false },
        { number: 13, title: "情報検索",      start: 75, end: 80, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 14, title: "課題理解",    start: 81, end: 86,  requires_passage: false, requires_audio: true },
        { number: 15, title: "ポイント理解", start: 87, end: 91,  requires_passage: false, requires_audio: true },
        { number: 16, title: "概要理解",    start: 92, end: 95,  requires_passage: false, requires_audio: true },
        { number: 17, title: "即時応答",    start: 96, end: 105, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // N1 — 2 sections, ~103 questions
  // Lang+Reading: 問1–11 (70q), Listening: 問12–15 (33q)
  // N1 Listening: 課題理解(6) + ポイント理解(7) + 概要理解(6) + 即時応答(14) = 33
  // Note: N1 does NOT have 統合理解 (問16) in listening — removed.
  // ─────────────────────────────────────────────────────────────
  N1: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",    start: 1,  end: 6,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "文脈規定",    start: 7,  end: 13, requires_passage: false, requires_audio: false },
        { number: 3,  title: "言い換え類義", start: 14, end: 18, requires_passage: false, requires_audio: false },
        { number: 4,  title: "用法",        start: 19, end: 23, requires_passage: false, requires_audio: false },
        { number: 5,  title: "文の文法①",  start: 24, end: 33, requires_passage: false, requires_audio: false },
        { number: 6,  title: "文の文法②",  start: 34, end: 38, requires_passage: false, requires_audio: false },
        { number: 7,  title: "短い読解",    start: 39, end: 47, requires_passage: true,  requires_audio: false },
        { number: 8,  title: "中読解",      start: 48, end: 53, requires_passage: true,  requires_audio: false },
        { number: 9,  title: "長い読解",    start: 54, end: 58, requires_passage: true,  requires_audio: false },
        { number: 10, title: "統合理解",    start: 59, end: 64, requires_passage: true,  requires_audio: false },
        { number: 11, title: "情報検索",    start: 65, end: 70, requires_passage: true,  requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 71, end: 76,  requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 77, end: 83,  requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 84, end: 89,  requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 90, end: 103, requires_passage: false, requires_audio: true },
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

/**
 * Maps a testType string to the relevant SectionKey(s) it covers.
 */
const TEST_TYPE_TO_KEYS: Record<string, SectionKey[]> = {
  full_test: ["VOCABULARY", "GRAMMAR", "READING", "LISTENING"],
  vocabulary: ["VOCABULARY"],
  grammar_reading: ["GRAMMAR", "READING"],
  listening: ["LISTENING"],
};

/**
 * Returns the JLPT structure for a given level filtered by testType.
 * For full_test → all sections returned as-is.
 * For specific categories → only sections whose sectionKeys overlap with
 * the target key are returned. Sections with multiple sectionKeys (e.g.
 * N3's 文法・読解 covers GRAMMAR + READING) are kept as-is because their
 * mondai belong to both topics.
 */
export function getStructureForTestType(
  level: JLPTLevel,
  testType: string
): SectionConfig[] {
  const targetKeys = TEST_TYPE_TO_KEYS[testType] ?? TEST_TYPE_TO_KEYS["full_test"];

  if (targetKeys.length === 4) {
    // full_test — return everything
    return JLPT_STRUCTURE[level] ?? [];
  }

  const allSections = JLPT_STRUCTURE[level] ?? [];
  return allSections.filter((section) =>
    section.sectionKeys.some((k) => targetKeys.includes(k))
  );
}
