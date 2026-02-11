/**
 * Japanese Language Detection
 *
 * Unicode ranges:
 *   Hiragana:       U+3040 – U+309F
 *   Katakana:       U+30A0 – U+30FF
 *   CJK Unified:    U+4E00 – U+9FFF  (kanji shared with Chinese)
 *   CJK Extension A U+3400 – U+4DBF
 *   Katakana Phonetic Extensions U+31F0 – U+31FF
 *   Half-width Katakana U+FF65 – U+FF9F
 *
 * Strategy:
 *   If the text contains ANY hiragana or katakana → definitely Japanese.
 *   If it contains CJK but no kana → could be Chinese; we classify as "ja"
 *     since this is a Japanese-learning app.
 *   Otherwise check for Latin/Vietnamese characters.
 */

import type { DetectedLanguage } from "./types";

// ─── Character class checkers ─────────────────────────

function isHiragana(ch: number): boolean {
  return ch >= 0x3040 && ch <= 0x309f;
}

function isKatakana(ch: number): boolean {
  return (
    (ch >= 0x30a0 && ch <= 0x30ff) ||
    (ch >= 0x31f0 && ch <= 0x31ff) ||
    (ch >= 0xff65 && ch <= 0xff9f)
  );
}

function isKanji(ch: number): boolean {
  return (ch >= 0x4e00 && ch <= 0x9fff) || (ch >= 0x3400 && ch <= 0x4dbf);
}

function isVietnameseDiacritic(ch: number): boolean {
  // Vietnamese-specific characters beyond basic Latin
  // Covers: ắ ằ ẳ ẵ ặ ă â ấ ầ ẩ ẫ ậ đ ê ế ề ể ễ ệ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ ư ứ ừ ử ữ ự
  const vnChars =
    "àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ";
  return vnChars.includes(String.fromCharCode(ch).toLowerCase());
}

// ─── Main detection function ──────────────────────────

export interface LanguageDetectionResult {
  language: DetectedLanguage;
  /** Human-readable label */
  label: string;
  /** Normalized form of the input */
  normalized: string;
  /** Whether the text contains kana (definitely Japanese, not just CJK) */
  hasKana: boolean;
  /** Whether the text contains kanji */
  hasKanji: boolean;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      language: "other",
      label: "Unknown",
      normalized: "",
      hasKana: false,
      hasKanji: false,
    };
  }

  let hasHiragana = false;
  let hasKatakana = false;
  let hasCJK = false;
  let hasVietnamese = false;
  let hasLatin = false;

  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (isHiragana(code)) hasHiragana = true;
    else if (isKatakana(code)) hasKatakana = true;
    else if (isKanji(code)) hasCJK = true;
    else if (isVietnameseDiacritic(code)) hasVietnamese = true;
    else if (
      (code >= 0x41 && code <= 0x5a) || // A-Z
      (code >= 0x61 && code <= 0x7a) // a-z
    )
      hasLatin = true;
  }

  const hasKana = hasHiragana || hasKatakana;

  // Japanese: has kana, or has kanji (we assume Japanese in this app context)
  if (hasKana || hasCJK) {
    return {
      language: "ja",
      label: "Tiếng Nhật",
      normalized: trimmed,
      hasKana,
      hasKanji: hasCJK,
    };
  }

  // Vietnamese diacritics present
  if (hasVietnamese) {
    return {
      language: "vi",
      label: "Tiếng Việt",
      normalized: trimmed,
      hasKana: false,
      hasKanji: false,
    };
  }

  // Latin-only → English
  if (hasLatin) {
    return {
      language: "en",
      label: "English",
      normalized: trimmed,
      hasKana: false,
      hasKanji: false,
    };
  }

  return {
    language: "other",
    label: "Khác",
    normalized: trimmed,
    hasKana: false,
    hasKanji: false,
  };
}
