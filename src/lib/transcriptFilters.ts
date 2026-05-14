"use client";

const COMMON_SILENCE_HALLUCINATIONS = new Set([
  "thank you",
  "thanks",
  "thanks for watching",
  "hank you",
  "we'll be right back",
  "we will be right back",
  "be right back",
  "i'll give it away",
  "ill give it away",
  "it down",
  "every source",
  "that we're talking about",
  "that we are talking about",
  "you don't mind you don' know what i'm talking about",
  "you don't mind you don't know what i'm talking about",
  "you dont mind you dont know what im talking about",
  "next video",
  "see you in the next video",
  "good night",
  "gracias",
  "idiot",
]);

const ALLOWED_LANGUAGE_CODES = new Set(["vi", "ja", "en"]);
const COMMON_NO_MARK_HALLUCINATION_PHRASES = [
  "hay subscribe cho kenh",
  "hay dang ky kenh",
  "dung quen dang ky kenh",
  "nho dang ky kenh",
  "khong bo lo nhung video hap dan",
  "nhung video hap dan",
  "cam on cac ban da theo doi",
  "cam on moi nguoi da theo doi",
  "ghiền mì gõ",
  "ghien mi go",
  "lalaschool",
  "subscribe",
];
const FOREIGN_SCRIPT_RE =
  /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u0E00-\u0E7F\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF]/;
const VIETNAMESE_MARK_RE = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const JAPANESE_RE = /[\u3040-\u30FF]/;

export interface TranscriptNoiseOptions {
  languageCode?: string | null;
  languageConfidence?: number | null;
}

function normalizeTranscriptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^\p{L}\p{N}' ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripVietnameseMarks(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function isLikelyTranscriptNoise(
  text: string,
  { languageCode, languageConfidence }: TranscriptNoiseOptions = {}
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^\[[^\]]+\]$/.test(trimmed)) return true;

  const normalized = normalizeTranscriptText(trimmed);
  if (!normalized) return true;
  if (COMMON_SILENCE_HALLUCINATIONS.has(normalized)) return true;
  const normalizedNoMarks = normalizeTranscriptText(stripVietnameseMarks(trimmed));
  if (COMMON_NO_MARK_HALLUCINATION_PHRASES.some((phrase) => normalizedNoMarks.includes(phrase))) {
    return true;
  }
  if (FOREIGN_SCRIPT_RE.test(trimmed)) return true;

  const repeatedWords = normalized.split(" ");
  if (repeatedWords.length >= 3 && new Set(repeatedWords).size === 1) return true;

  const cjkChars = trimmed.match(/[\u3400-\u9FFF]/g)?.length ?? 0;
  const kanaChars = trimmed.match(/[\u3040-\u30FF]/g)?.length ?? 0;
  const latinChars = trimmed.match(/[A-Za-zÀ-ỹ]/g)?.length ?? 0;
  if (cjkChars > 0 && kanaChars === 0 && latinChars === 0 && [...trimmed].length <= 3) {
    return true;
  }

  const code = languageCode?.toLowerCase();
  if (code && languageConfidence != null && languageConfidence >= 0.85 && !ALLOWED_LANGUAGE_CODES.has(code)) {
    return true;
  }

  const words = normalized.split(" ").filter(Boolean);
  const hasVietnameseMarks = VIETNAMESE_MARK_RE.test(trimmed);
  const hasJapanese = JAPANESE_RE.test(trimmed);
  const looksEnglishOnly = /^[a-z0-9' ]+$/.test(normalized);
  if (looksEnglishOnly && !hasVietnameseMarks && !hasJapanese && words.length <= 8) {
    return true;
  }

  return false;
}
