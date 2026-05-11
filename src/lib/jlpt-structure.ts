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
 * All levels have mondai 1-15 following JLPT standard format.
 *
 * IMPORTANT — slot numbering logic:
 * - Standalone mondai: each question occupies its own slot (cursor += count)
 * - Passage mondai (requires_passage: true): all sub-questions share ONE slot
 *   (cursor += 1), displayed as "M.1", "M.2" etc. in the UI
 */

export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";
export type SectionKey = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
export type TestType = "full_test" | "vocabulary" | "grammar_reading" | "listening";

// Default question counts per mondai (used when counts not provided)
export const JLPT_PASSAGE_DEFAULTS: Record<JLPTLevel, Record<number, number>> = {
  N5: {},
  N4: {},
  N3: {},
  N2: {},
  N1: {},
};

export interface MondaiConfig {
  number: number;       // mondaiNumber stored in DB (1-15 for all levels)
  title: string;        // display title
  start: number;        // start question_order (child question)
  end: number;          // end question_order (inclusive)
  requires_passage: boolean;
  requires_audio: boolean;
  instruction?: string; // Official JLPT direction text shown above questions
  _totalCount?: number; // total number of child questions (populated by rebuildStructureWithCounts)
  _displayStart?: number; // visible question number; differs from question_order for child-mode mondai
  _displayEnd?: number;
}

export interface SectionConfig {
  name: string;         // display name
  sectionKeys: SectionKey[];   // backend section enum values this covers
  mondai: MondaiConfig[];
}

/**
 * Rebuild a level's structure using custom question counts per mondai.
 *
 * Rules:
 * - PASSAGE mondai (requires_passage: true):
 *     Each child slot shares ONE position → end = start.
 *     Cursor increments by 1 (not by count).
 * - STANDALONE mondai (requires_passage: false):
 *     Each question gets its own slot → end = start + count - 1.
 *     Uses counts from database/localStorage if available, else hardcoded defaults.
 *
 * @param level           JLPT level key
 * @param counts          Record<mondaiNumber, questionCount> — overrides from admin config
 * @param filteredSections Optional pre-filtered sections (e.g. from getStructureForTestType).
 *                        If provided, rebuilds only those sections while keeping slot numbering
 *                        consistent with the full-structure cursor.
 * @returns New sections array with recalculated start/end
 */
export function rebuildStructureWithCounts(
  level: JLPTLevel,
  counts: Record<number, number>,
  filteredSections?: SectionConfig[],
  childModes: Record<number, boolean> = {},
): SectionConfig[] {
  const base = filteredSections ?? JLPT_STRUCTURE[level];
  const defaults = JLPT_PASSAGE_DEFAULTS[level] ?? {};
  let actualCursor = 1;
  let displayCursor = 1;

  const rebuilt = base.map((section) => ({
    ...section,
    mondai: section.mondai.map((m) => {
      const isPassage = childModes[m.number] ?? m.requires_passage;
      const baseCount = m.end - m.start + 1;
      const count = counts[m.number] ?? baseCount;

      // Child-mode mondai: one visible parent number, many scored child rows.
      if (isPassage) {
        const totalCount = counts[m.number] ?? defaults[m.number] ?? baseCount;
        const start = actualCursor;
        const end = start + totalCount - 1;
        const displayStart = displayCursor;
        actualCursor = end + 1;
        displayCursor += 1;
        return {
          ...m,
          start,
          end,
          requires_passage: true,
          _displayStart: displayStart,
          _displayEnd: displayStart,
          _totalCount: totalCount,
        };
      }

      const start = actualCursor;
      const end = start + count - 1;
      const displayStart = displayCursor;
      const displayEnd = displayStart + count - 1;
      actualCursor = end + 1;
      displayCursor = displayEnd + 1;
      return {
        ...m,
        start,
        end,
        requires_passage: false,
        _displayStart: displayStart,
        _displayEnd: displayEnd,
        _totalCount: count,
      };
    }),
  }));

  return rebuilt;
}

// ─────────────────────────────────────────────────────────────────────────────
// JLPT MONDAI INSTRUCTIONS (mondaiTitle / 問題文 )
// These are the official JLPT instruction texts shown above each mondai group.
// ─────────────────────────────────────────────────────────────────────────────
export const JLPT_MONDAI_INSTRUCTIONS: Record<number, string> = {
  // Vocabulary
  1: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  2: "もんだい＿＿＿のことばは　どう　かきますか。１・２・３・４から　いちばん　いいものを　ひとつ　えらんで　ください。",
  3: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  4: "もんだい　＿＿＿の　ぶんと　だいたい　おなじ　いみの　ぶんが　あります。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  5: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。",
  // Grammar
  6: "もんだい　（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  7: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  // Reading
  8: "もんだい　つぎの　文章を　読んで、質問に 答えて ください。答えは、１・２・３・４から いちばん いいものを 一つ 選んで ください。",
  9: "もんだい　つぎの　文章を　読んで、部屋に 答えて ください。こたえは、１・２・３・４から ひとつ えらんで ください。",
  10: "もんだい　つぎの　文章を　読んで、質問に 答えて ください。答えは、１・２・３・４から いちばん いいものを 一つ 選んで ください。",
  11: "つぎの　文を　読んで、部屋に 答えて ください。答えは、１・２・３・４から ひとつ 選んで ください。",
  // Listening
  12: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  13: "もんだい　では、はじめに　しつもんを　きいて　ください。それから　はなしを　きいて、もんだいようしの　1から　４の　なかから　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  14: "もんだい　では、はじめに　しつもんを　きいて　ください。それから　はなしを　きいて、もんだいようしの　1から　４の　なかから　いちばん　いい　ものを　ひとつ　えらんで　ください。",
  15: "もんだい　では、はじめに　しつもんを　聞いて　ください。　それとも　はなしを　聞いて、もんだいようしの　1から　４の　なかから　いちばん　いい　ものを　ひとつ　えらんで　ください。",
};

export const JLPT_STRUCTURE: Record<JLPTLevel, SectionConfig[]> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // N5 — 57 non-list + 37 listening = 94 total
  // Vocab: mondai 1-5 (30q), Grammar: mondai 6-7 (18q), Reading: mondai 8-11 (9 slots)
  // Listening: mondai 12-15 (37q)
  // ─────────────────────────────────────────────────────────────────────────────
  N5: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1,  title: "漢字読み",  start: 1,  end: 9,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",      start: 10, end: 15, requires_passage: false, requires_audio: false },
        { number: 3,  title: "文脈規定",  start: 16, end: 25, requires_passage: false, requires_audio: false },
        { number: 4,  title: "言い換え",  start: 26, end: 30, requires_passage: false, requires_audio: false },
        { number: 5,  title: "語形成",    start: 31, end: 35, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①", start: 36, end: 42, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②", start: 43, end: 48, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",  start: 49, end: 52, requires_passage: false, requires_audio: false },
        { number: 9,  title: "中読解",    start: 53, end: 56, requires_passage: false, requires_audio: false },
        { number: 10, title: "情報検索",  start: 57, end: 57, requires_passage: false, requires_audio: false },
        { number: 11, title: "長い文章",  start: 58, end: 58, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 59, end: 65, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 66, end: 72, requires_passage: false, requires_audio: true },
        { number: 14, title: "発話表現",    start: 73, end: 78, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 79, end: 94, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // N4 — 57 non-list + 36 listening = 93 total
  // Vocab: mondai 1-5 (33q), Grammar: mondai 6-7 (18q), Reading: mondai 8-11 (6 slots)
  // Listening: mondai 12-15 (36q)
  // ─────────────────────────────────────────────────────────────────────────────
  N4: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1,  title: "漢字読み",  start: 1,  end: 7,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",      start: 8,  end: 13, requires_passage: false, requires_audio: false },
        { number: 3,  title: "文脈規定",  start: 14, end: 23, requires_passage: false, requires_audio: false },
        { number: 4,  title: "言い換え",  start: 24, end: 28, requires_passage: false, requires_audio: false },
        { number: 5,  title: "語形成",    start: 29, end: 33, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①", start: 34, end: 42, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②", start: 43, end: 48, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",  start: 49, end: 51, requires_passage: false, requires_audio: false },
        { number: 9,  title: "中読解",    start: 52, end: 54, requires_passage: false, requires_audio: false },
        { number: 10, title: "情報検索",  start: 55, end: 57, requires_passage: false, requires_audio: false },
        { number: 11, title: "長い文章",  start: 58, end: 58, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 59, end: 65, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 66, end: 72, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 73, end: 78, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 79, end: 93, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // N3 — 57 non-list + 37 listening = 94 total
  // Vocab: mondai 1-5 (35q), Grammar: mondai 6-7 (18q), Reading: mondai 8-11 (4 slots)
  // Listening: mondai 12-15 (37q)
  // ─────────────────────────────────────────────────────────────────────────────
  N3: [
    {
      name: "文字・語彙 (Vocabulary)",
      sectionKeys: ["VOCABULARY"],
      mondai: [
        { number: 1,  title: "漢字読み",  start: 1,  end: 8,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",      start: 9,  end: 14, requires_passage: false, requires_audio: false },
        { number: 3,  title: "文脈規定",  start: 15, end: 25, requires_passage: false, requires_audio: false },
        { number: 4,  title: "言い換え",  start: 26, end: 30, requires_passage: false, requires_audio: false },
        { number: 5,  title: "語形成",    start: 31, end: 35, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "文法・読解 (Grammar & Reading)",
      sectionKeys: ["GRAMMAR", "READING"],
      mondai: [
        { number: 6,  title: "文の文法①", start: 36, end: 48, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法②", start: 49, end: 53, requires_passage: false, requires_audio: false },
        { number: 8,  title: "短い読解",  start: 54, end: 54, requires_passage: false, requires_audio: false },
        { number: 9,  title: "中読解①",  start: 55, end: 55, requires_passage: false, requires_audio: false },
        { number: 10, title: "中読解②",  start: 56, end: 56, requires_passage: false, requires_audio: false },
        { number: 11, title: "情報検索",  start: 57, end: 57, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 58, end: 64, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 65, end: 71, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 72, end: 74, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 75, end: 94, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // N2 — 57 non-list + 36 listening = 93 total
  // Lang+Reading: mondai 1-12 (57q), Listening: mondai 13-15 (36q)
  // ─────────────────────────────────────────────────────────────────────────────
  N2: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",     start: 1,  end: 5,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "表記",          start: 6,  end: 10, requires_passage: false, requires_audio: false },
        { number: 3,  title: "文脈規定",      start: 11, end: 16, requires_passage: false, requires_audio: false },
        { number: 4,  title: "言い換え類義",  start: 17, end: 21, requires_passage: false, requires_audio: false },
        { number: 5,  title: "語形成",        start: 22, end: 26, requires_passage: false, requires_audio: false },
        { number: 6,  title: "用法",          start: 27, end: 31, requires_passage: false, requires_audio: false },
        { number: 7,  title: "文の文法①",    start: 32, end: 41, requires_passage: false, requires_audio: false },
        { number: 8,  title: "文の文法②",    start: 42, end: 47, requires_passage: false, requires_audio: false },
        { number: 9,  title: "短い読解",      start: 48, end: 48, requires_passage: false, requires_audio: false },
        { number: 10, title: "中読解",        start: 49, end: 49, requires_passage: false, requires_audio: false },
        { number: 11, title: "長い読解",      start: 50, end: 50, requires_passage: false, requires_audio: false },
        { number: 12, title: "情報検索",      start: 51, end: 57, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 13, title: "課題理解",    start: 58, end: 63, requires_passage: false, requires_audio: true },
        { number: 14, title: "ポイント理解", start: 64, end: 69, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 70, end: 93, requires_passage: false, requires_audio: true },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // N1 — 55 non-list + 36 listening = 91 total
  // Lang+Reading: mondai 1-11 (55q), Listening: mondai 12-15 (36q)
  // ─────────────────────────────────────────────────────────────────────────────
  N1: [
    {
      name: "言語知識・読解 (Language Knowledge & Reading)",
      sectionKeys: ["VOCABULARY", "GRAMMAR", "READING"],
      mondai: [
        { number: 1,  title: "漢字読み",      start: 1,  end: 5,  requires_passage: false, requires_audio: false },
        { number: 2,  title: "文脈規定",      start: 6,  end: 12, requires_passage: false, requires_audio: false },
        { number: 3,  title: "言い換え類義",  start: 13, end: 17, requires_passage: false, requires_audio: false },
        { number: 4,  title: "用法",          start: 18, end: 22, requires_passage: false, requires_audio: false },
        { number: 5,  title: "文の文法①",    start: 23, end: 32, requires_passage: false, requires_audio: false },
        { number: 6,  title: "文の文法②",    start: 33, end: 37, requires_passage: false, requires_audio: false },
        { number: 7,  title: "短い読解",      start: 38, end: 38, requires_passage: false, requires_audio: false },
        { number: 8,  title: "中読解",        start: 39, end: 39, requires_passage: false, requires_audio: false },
        { number: 9,  title: "長い読解",      start: 40, end: 40, requires_passage: false, requires_audio: false },
        { number: 10, title: "統合理解",      start: 41, end: 41, requires_passage: false, requires_audio: false },
        { number: 11, title: "情報検索",      start: 42, end: 55, requires_passage: false, requires_audio: false },
      ],
    },
    {
      name: "聴解 (Listening)",
      sectionKeys: ["LISTENING"],
      mondai: [
        { number: 12, title: "課題理解",    start: 56, end: 61, requires_passage: false, requires_audio: true },
        { number: 13, title: "ポイント理解", start: 62, end: 67, requires_passage: false, requires_audio: true },
        { number: 14, title: "概要理解",    start: 68, end: 73, requires_passage: false, requires_audio: true },
        { number: 15, title: "即時応答",    start: 74, end: 91, requires_passage: false, requires_audio: true },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/** Get all question numbers for a mondai group.
 * For passage mondai: returns actual questionOrder values [start, start+1, ..., start+count-1]
 * For standalone mondai: returns actual question_order values [start, start+1, ..., end]
 */
export function getQuestionNumbers(mondai: MondaiConfig): number[] {
  const count = mondai._totalCount ?? (mondai.end - mondai.start + 1);
  return Array.from({ length: count }, (_, i) => mondai.start + i);
}

// ─────────────────────────────────────────────────────────────────────────────
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
 * the target key are returned.
 */
export function getStructureForTestType(
  level: JLPTLevel,
  testType: string
): SectionConfig[] {
  const targetKeys = TEST_TYPE_TO_KEYS[testType] ?? TEST_TYPE_TO_KEYS["full_test"];

  if (targetKeys.length === 4) {
    return JLPT_STRUCTURE[level] ?? [];
  }

  const allSections = JLPT_STRUCTURE[level] ?? [];
  return allSections.filter((section) =>
    section.sectionKeys.some((k) => targetKeys.includes(k))
  );
}

/**
 * Get the default instruction text for a mondai number.
 * Returns the official JLPT instruction for that mondai type.
 */
export function getMondaiInstruction(mondaiNumber: number): string {
  return JLPT_MONDAI_INSTRUCTIONS[mondaiNumber] ?? "";
}
