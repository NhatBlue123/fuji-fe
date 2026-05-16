"use client";

export type TranscriptLanguageCode =
  | "vi"
  | "ja"
  | "en"
  | "zh"
  | "ko"
  | "pt"
  | "hi"
  | "th"
  | "other";

export type TranscriptClassroomMode = "japanese" | "english" | "vietnamese" | "auto";

export interface TranscriptLanguagePolicy {
  primaryLanguage?: TranscriptLanguageCode;
  classroomMode?: TranscriptClassroomMode;
  priorityLanguages?: TranscriptLanguageCode[];
  allowedLanguages?: TranscriptLanguageCode[];
  classroomTopic?: string | null;
}

export interface TranscriptNoiseOptions {
  languageCode?: string | null;
  languageConfidence?: number | null;
  source?: "browser" | "assemblyai" | "stomp" | "unknown";
  isFinal?: boolean;
  languagePolicy?: TranscriptLanguagePolicy;
}

interface TranscriptLanguageSample {
  language: TranscriptLanguageCode;
  confidence: number;
  text: string;
}

export interface TranscriptLanguageContext {
  policy: Required<Omit<TranscriptLanguagePolicy, "classroomTopic">> & {
    classroomTopic: string | null;
  };
  activeLanguage: TranscriptLanguageCode;
  recent: TranscriptLanguageSample[];
}

interface ScriptStats {
  totalLetters: number;
  latin: number;
  vietnameseSpecific: number;
  vietnameseTone: number;
  kana: number;
  han: number;
  hangul: number;
  devanagari: number;
  thai: number;
  cyrillic: number;
  arabic: number;
  hebrew: number;
  otherLetters: number;
}

interface DetectedLanguage {
  language: TranscriptLanguageCode;
  confidence: number;
  reason: string;
}

export interface TranscriptFilterDecision {
  accepted: boolean;
  text: string;
  language: TranscriptLanguageCode;
  confidence: number;
  reason?: string;
}

const HISTORY_LIMIT = 10;
const DEFAULT_ALLOWED_LANGUAGES: TranscriptLanguageCode[] = [
  "vi",
  "ja",
  "en",
  "zh",
  "ko",
  "pt",
  "hi",
  "th",
  "other",
];

const PRIORITY_BY_CLASSROOM: Record<TranscriptClassroomMode, TranscriptLanguageCode[]> = {
  japanese: ["vi", "ja", "en"],
  english: ["en", "vi", "ja"],
  vietnamese: ["vi", "ja", "en"],
  auto: ["vi", "ja", "en"],
};

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
  "e ai",
]);

const COMMON_NO_MARK_HALLUCINATION_PHRASES = [
  "hay subscribe cho kenh",
  "hay dang ky kenh",
  "dung quen dang ky kenh",
  "nho dang ky kenh",
  "khong bo lo nhung video hap dan",
  "nhung video hap dan",
  "cam on cac ban da theo doi",
  "cam on moi nguoi da theo doi",
  "ghien mi go",
  "lalaschool",
  "subscribe",
  "thanks for watching",
  "see you next time",
  "we will be right back",
  "i think its up to the end of the day",
  "i think i could lie on",
  "and we just looked curiously",
  "we will talk now",
];

const JAPANESE_HALLUCINATION_NO_SPACE = new Set([
  "\u3054\u8996\u8074\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3057\u305F",
]);

const VIETNAMESE_CUE_WORDS = new Set([
  "alo",
  "anh",
  "ban",
  "biet",
  "buoi",
  "cai",
  "can",
  "cau",
  "chao",
  "chi",
  "cho",
  "chung",
  "co",
  "cua",
  "dau",
  "day",
  "de",
  "dieu",
  "dung",
  "duoc",
  "em",
  "giao",
  "giang",
  "giup",
  "hoc",
  "hoi",
  "hom",
  "khong",
  "lam",
  "la",
  "minh",
  "mot",
  "muon",
  "nay",
  "nghe",
  "ngu",
  "nhat",
  "noi",
  "nua",
  "phai",
  "phap",
  "roi",
  "sai",
  "sao",
  "sinh",
  "ta",
  "thay",
  "thi",
  "tieng",
  "toi",
  "tu",
  "van",
  "vao",
  "vien",
  "viet",
  "voi",
  "vung",
  "xin",
]);

const ENGLISH_CUE_WORDS = new Set([
  "about",
  "and",
  "are",
  "class",
  "english",
  "hello",
  "is",
  "lesson",
  "now",
  "please",
  "teacher",
  "that",
  "the",
  "this",
  "today",
  "we",
  "what",
  "will",
  "you",
]);

const PORTUGUESE_CUE_WORDS = new Set([
  "agora",
  "ai",
  "aqui",
  "bom",
  "gente",
  "nao",
  "novo",
  "obrigado",
  "para",
  "pra",
  "que",
  "sim",
  "tambem",
  "voce",
  "vou",
]);

const VIETNAMESE_SPECIFIC_RE = /[\u0103\u00E2\u0111\u00EA\u00F4\u01A1\u01B0]/i;
const VIETNAMESE_TONE_RE =
  /[\u00E1\u00E0\u1EA3\u00E3\u1EA1\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u00E9\u00E8\u1EBB\u1EBD\u1EB9\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u00ED\u00EC\u1EC9\u0129\u1ECB\u00F3\u00F2\u1ECF\u00F5\u1ECD\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u00FA\u00F9\u1EE7\u0169\u1EE5\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u00FD\u1EF3\u1EF7\u1EF9\u1EF5]/i;
const LATIN_RE = /[A-Za-z\u00C0-\u024F]/;
const JAPANESE_RE = /[\u3040-\u30FF]/;
const HAN_RE = /[\u3400-\u9FFF]/;
const HANGUL_RE = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const THAI_RE = /[\u0E00-\u0E7F]/;
const CYRILLIC_RE = /[\u0400-\u04FF]/;
const ARABIC_RE = /[\u0600-\u06FF]/;
const HEBREW_RE = /[\u0590-\u05FF]/;
const LETTER_RE = /\p{L}/u;
const NORDIC_LATIN_RE = /[\u00F8\u00D8\u00E6\u00C6\u00E5\u00C5]/;

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

function normalizeNoMarks(text: string): string {
  return normalizeTranscriptText(stripVietnameseMarks(text));
}

function wordsOf(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

function countWordHits(words: string[], dictionary: Set<string>): number {
  return words.reduce((count, word) => count + (dictionary.has(word) ? 1 : 0), 0);
}

function clampConfidence(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeLanguageCode(code?: string | null): TranscriptLanguageCode | null {
  if (!code) return null;
  const normalized = code.toLowerCase().split(/[-_]/)[0];
  if (normalized === "cmn" || normalized === "yue") return "zh";
  if (normalized === "jp") return "ja";
  if (normalized === "kr") return "ko";
  if (DEFAULT_ALLOWED_LANGUAGES.includes(normalized as TranscriptLanguageCode)) {
    return normalized as TranscriptLanguageCode;
  }
  return "other";
}

function inferClassroomMode(topic?: string | null): TranscriptClassroomMode {
  const normalizedTopic = normalizeNoMarks(topic ?? "");
  if (!normalizedTopic) return "japanese";
  if (/\b(english|tieng anh|speaking english|ielts|toeic)\b/.test(normalizedTopic)) {
    return "english";
  }
  if (/\b(vietnamese|tieng viet)\b/.test(normalizedTopic)) return "vietnamese";
  if (/\b(japanese|tieng nhat|jlpt|n5|n4|n3|n2|n1|kanji|hiragana|katakana|ngu phap|tu vung)\b/.test(normalizedTopic)) {
    return "japanese";
  }
  return "japanese";
}

function normalizePolicy(policy: TranscriptLanguagePolicy = {}) {
  const classroomMode = policy.classroomMode ?? inferClassroomMode(policy.classroomTopic);
  const priorityLanguages = policy.priorityLanguages?.length
    ? policy.priorityLanguages
    : PRIORITY_BY_CLASSROOM[classroomMode];
  const primaryLanguage = policy.primaryLanguage ?? priorityLanguages[0] ?? "vi";
  const allowedLanguages = Array.from(new Set([
    primaryLanguage,
    ...priorityLanguages,
    ...(policy.allowedLanguages?.length ? policy.allowedLanguages : DEFAULT_ALLOWED_LANGUAGES),
  ]));

  return {
    primaryLanguage,
    classroomMode,
    priorityLanguages,
    allowedLanguages,
    classroomTopic: policy.classroomTopic ?? null,
  };
}

export function createTranscriptLanguageContext(
  policy: TranscriptLanguagePolicy = {}
): TranscriptLanguageContext {
  const normalizedPolicy = normalizePolicy(policy);
  return {
    policy: normalizedPolicy,
    activeLanguage: normalizedPolicy.primaryLanguage,
    recent: [],
  };
}

function getScriptStats(text: string): ScriptStats {
  const stats: ScriptStats = {
    totalLetters: 0,
    latin: 0,
    vietnameseSpecific: 0,
    vietnameseTone: 0,
    kana: 0,
    han: 0,
    hangul: 0,
    devanagari: 0,
    thai: 0,
    cyrillic: 0,
    arabic: 0,
    hebrew: 0,
    otherLetters: 0,
  };

  for (const char of Array.from(text)) {
    if (!LETTER_RE.test(char)) continue;
    stats.totalLetters += 1;
    if (VIETNAMESE_SPECIFIC_RE.test(char)) stats.vietnameseSpecific += 1;
    if (VIETNAMESE_TONE_RE.test(char)) stats.vietnameseTone += 1;
    if (JAPANESE_RE.test(char)) stats.kana += 1;
    else if (HAN_RE.test(char)) stats.han += 1;
    else if (HANGUL_RE.test(char)) stats.hangul += 1;
    else if (DEVANAGARI_RE.test(char)) stats.devanagari += 1;
    else if (THAI_RE.test(char)) stats.thai += 1;
    else if (CYRILLIC_RE.test(char)) stats.cyrillic += 1;
    else if (ARABIC_RE.test(char)) stats.arabic += 1;
    else if (HEBREW_RE.test(char)) stats.hebrew += 1;
    else if (LATIN_RE.test(char)) stats.latin += 1;
    else stats.otherLetters += 1;
  }

  return stats;
}

function detectLatinLanguage(text: string, stats: ScriptStats): DetectedLanguage {
  const normalizedNoMarks = normalizeNoMarks(text);
  const words = wordsOf(normalizedNoMarks);
  const vietnameseHits = countWordHits(words, VIETNAMESE_CUE_WORDS);
  const englishHits = countWordHits(words, ENGLISH_CUE_WORDS);
  const portugueseHits = countWordHits(words, PORTUGUESE_CUE_WORDS);
  const hasVietnameseSpecificMarks = stats.vietnameseSpecific > 0;
  const hasVietnameseToneMarks = stats.vietnameseTone > 0;

  if (hasVietnameseSpecificMarks) {
    return { language: "vi", confidence: 0.96, reason: "vietnamese-specific-mark" };
  }

  if (hasVietnameseToneMarks && vietnameseHits >= 1) {
    return { language: "vi", confidence: 0.9, reason: "vietnamese-tone-cue" };
  }

  if (vietnameseHits >= 3 || (vietnameseHits >= 2 && words.length <= 8)) {
    return { language: "vi", confidence: 0.82, reason: "vietnamese-word-cues" };
  }

  if (portugueseHits >= 2 || (NORDIC_LATIN_RE.test(text) && portugueseHits === 0)) {
    return {
      language: portugueseHits >= 2 ? "pt" : "other",
      confidence: portugueseHits >= 2 ? 0.72 : 0.58,
      reason: portugueseHits >= 2 ? "portuguese-word-cues" : "unsupported-latin-mark",
    };
  }

  if (englishHits >= 2 || /^[a-z0-9' ]+$/.test(normalizeTranscriptText(text))) {
    return {
      language: "en",
      confidence: englishHits >= 2 ? 0.74 : 0.55,
      reason: englishHits >= 2 ? "english-word-cues" : "latin-fallback",
    };
  }

  return { language: "other", confidence: 0.38, reason: "latin-unknown" };
}

function detectTextLanguage(text: string, stats: ScriptStats): DetectedLanguage {
  const normalizedNoMarks = normalizeNoMarks(text);
  const words = wordsOf(normalizedNoMarks);
  const vietnameseHits = countWordHits(words, VIETNAMESE_CUE_WORDS);

  if (stats.latin > 0 && (stats.vietnameseSpecific > 0 || stats.vietnameseTone > 0 || vietnameseHits >= 2)) {
    return detectLatinLanguage(text, stats);
  }

  if (stats.kana > 0) {
    const ratio = stats.kana / Math.max(1, stats.totalLetters);
    return {
      language: "ja",
      confidence: Math.min(0.97, 0.74 + ratio * 0.22),
      reason: "japanese-kana",
    };
  }

  if (stats.hangul > 0) {
    return { language: "ko", confidence: 0.86, reason: "korean-hangul" };
  }

  if (stats.devanagari > 0) {
    return { language: "hi", confidence: 0.82, reason: "devanagari-script" };
  }

  if (stats.thai > 0) {
    return { language: "th", confidence: 0.82, reason: "thai-script" };
  }

  if (stats.han > 0 && stats.latin === 0) {
    return {
      language: "zh",
      confidence: stats.han >= 6 ? 0.78 : 0.55,
      reason: "han-only",
    };
  }

  if (stats.latin > 0) return detectLatinLanguage(text, stats);
  if (stats.cyrillic > 0 || stats.arabic > 0 || stats.hebrew > 0 || stats.otherLetters > 0) {
    return { language: "other", confidence: 0.62, reason: "other-script" };
  }

  return { language: "other", confidence: 0.25, reason: "no-language-signal" };
}

function chooseLanguage(
  detected: DetectedLanguage,
  hintedLanguage: TranscriptLanguageCode | null,
  hintedConfidence: number,
  context: TranscriptLanguageContext | null
): DetectedLanguage {
  if (detected.confidence >= 0.72) return detected;
  if (!hintedLanguage) return detected;

  const policy = context?.policy ?? normalizePolicy();
  const hintedIsPriority = policy.priorityLanguages.includes(hintedLanguage);

  if (hintedIsPriority && hintedConfidence >= 0.62) {
    return {
      language: hintedLanguage,
      confidence: Math.max(hintedConfidence, detected.confidence),
      reason: "provider-priority-hint",
    };
  }

  if (hintedConfidence >= 0.82) {
    return {
      language: hintedLanguage,
      confidence: hintedConfidence,
      reason: "provider-strong-hint",
    };
  }

  return detected;
}

function hasCommonHallucination(text: string): boolean {
  const normalized = normalizeTranscriptText(text);
  if (COMMON_SILENCE_HALLUCINATIONS.has(normalized)) return true;

  const normalizedNoMarks = normalizeNoMarks(text);
  if (COMMON_NO_MARK_HALLUCINATION_PHRASES.some((phrase) => normalizedNoMarks.includes(phrase))) {
    return true;
  }

  const noWhitespace = text.replace(/\s+/g, "");
  if (JAPANESE_HALLUCINATION_NO_SPACE.has(noWhitespace)) return true;

  return false;
}

function isRepeatedWordNoise(normalized: string): boolean {
  const words = wordsOf(normalized);
  if (words.length >= 3 && new Set(words).size === 1) return true;
  if (words.length >= 6) {
    const uniqueRatio = new Set(words).size / words.length;
    return uniqueRatio <= 0.35;
  }
  return false;
}

function isFragmentedCjkNoise(text: string, stats: ScriptStats): boolean {
  const noSpaces = text.replace(/\s+/g, "");
  const spacedHan = /(?:[\u3400-\u9FFF]\s+){2,}[\u3400-\u9FFF]/.test(text);
  if (spacedHan && noSpaces.length <= 10) return true;
  if (stats.han > 0 && stats.kana === 0 && stats.latin === 0 && stats.han <= 3) return true;
  return false;
}

function countScriptGroups(stats: ScriptStats): number {
  return [
    stats.latin > 0,
    stats.kana > 0,
    stats.han > 0,
    stats.hangul > 0,
    stats.devanagari > 0,
    stats.thai > 0,
    stats.cyrillic > 0,
    stats.arabic > 0,
    stats.hebrew > 0,
    stats.otherLetters > 0,
  ].filter(Boolean).length;
}

function countRecentLanguage(context: TranscriptLanguageContext | null, language: TranscriptLanguageCode): number {
  if (!context) return 0;
  return context.recent.filter((item) => item.language === language).length;
}

function isPriorityLanguage(
  language: TranscriptLanguageCode,
  context: TranscriptLanguageContext | null
): boolean {
  const policy = context?.policy ?? normalizePolicy();
  return policy.priorityLanguages.includes(language);
}

function shouldAcceptLanguage(
  text: string,
  language: TranscriptLanguageCode,
  confidence: number,
  stats: ScriptStats,
  options: TranscriptNoiseOptions,
  context: TranscriptLanguageContext | null
): { accepted: boolean; reason?: string } {
  const isFinal = options.isFinal !== false;
  const source = options.source ?? "unknown";
  const activeLanguage = context?.activeLanguage ?? (context?.policy.primaryLanguage ?? "vi");
  const recentSameLanguage = countRecentLanguage(context, language);
  const priorityLanguage = isPriorityLanguage(language, context);
  const normalizedNoMarks = normalizeNoMarks(text);
  const words = wordsOf(normalizedNoMarks);

  if (options.languageConfidence != null && options.languageConfidence < 0.25 && confidence < 0.75) {
    return { accepted: false, reason: "provider-confidence-too-low" };
  }

  if (language === "vi") {
    if (confidence >= 0.45) return { accepted: true };
    return { accepted: false, reason: "weak-vietnamese-signal" };
  }

  if (language === "ja") {
    const strongJapaneseText = stats.kana > 0 || (stats.han >= 4 && (activeLanguage === "ja" || recentSameLanguage > 0));
    if (strongJapaneseText && confidence >= 0.52) return { accepted: true };
    return { accepted: false, reason: "weak-japanese-signal" };
  }

  if (language === "en") {
    if (words.length <= 1 && isFinal) return { accepted: false, reason: "english-too-short" };
    if (activeLanguage === "vi" && source === "assemblyai" && confidence < 0.7 && recentSameLanguage === 0 && words.length < 6) {
      return { accepted: false, reason: "english-outside-vietnamese-context" };
    }
    return { accepted: true };
  }

  if (!priorityLanguage) {
    const scriptCount = Math.max(
      stats.han,
      stats.hangul,
      stats.devanagari,
      stats.thai,
      stats.cyrillic,
      stats.arabic,
      stats.hebrew,
      stats.otherLetters,
      language === "pt" ? stats.latin : 0
    );
    const strongOtherSignal =
      confidence >= 0.9 ||
      (confidence >= 0.82 && scriptCount >= 14) ||
      (recentSameLanguage >= 2 && confidence >= 0.62);
    const strongInVietnameseContext =
      (confidence >= 0.93 && scriptCount >= 6) ||
      (confidence >= 0.88 && scriptCount >= 18) ||
      (recentSameLanguage >= 2 && confidence >= 0.62);

    if (activeLanguage === "vi" && !strongInVietnameseContext) {
      return { accepted: false, reason: "non-priority-language-outside-context" };
    }

    if (!strongOtherSignal && scriptCount < 12 && words.length < 8) {
      return { accepted: false, reason: "weak-non-priority-language" };
    }
  }

  return { accepted: true };
}

export function evaluateTranscriptCandidate(
  text: string,
  options: TranscriptNoiseOptions = {},
  context: TranscriptLanguageContext | null = null
): TranscriptFilterDecision {
  const trimmed = text.trim();
  if (!trimmed) {
    return { accepted: false, text: "", language: "other", confidence: 0, reason: "empty" };
  }
  if (/^\[[^\]]+\]$/.test(trimmed)) {
    return { accepted: false, text: trimmed, language: "other", confidence: 0, reason: "bracketed-event" };
  }

  const normalized = normalizeTranscriptText(trimmed);
  if (!normalized || normalized.length < (options.isFinal === false ? 3 : 4)) {
    return { accepted: false, text: trimmed, language: "other", confidence: 0, reason: "too-short" };
  }
  if (hasCommonHallucination(trimmed)) {
    return { accepted: false, text: trimmed, language: "other", confidence: 0, reason: "known-hallucination" };
  }
  if (isRepeatedWordNoise(normalized)) {
    return { accepted: false, text: trimmed, language: "other", confidence: 0, reason: "repeated-word-noise" };
  }

  const stats = getScriptStats(trimmed);
  if (isFragmentedCjkNoise(trimmed, stats)) {
    return { accepted: false, text: trimmed, language: "zh", confidence: 0, reason: "fragmented-cjk" };
  }
  if (countScriptGroups(stats) >= 3 && normalized.length < 40) {
    return { accepted: false, text: trimmed, language: "other", confidence: 0, reason: "mixed-script-fragment" };
  }

  const detected = detectTextLanguage(trimmed, stats);
  const hintedLanguage = normalizeLanguageCode(options.languageCode);
  const hintedConfidence = clampConfidence(options.languageConfidence);
  const chosen = chooseLanguage(detected, hintedLanguage, hintedConfidence, context);
  const confidence = Math.max(
    chosen.confidence,
    hintedLanguage == null || hintedLanguage === chosen.language ? hintedConfidence : 0
  );
  const policy = context?.policy ?? normalizePolicy(options.languagePolicy);

  if (!policy.allowedLanguages.includes(chosen.language)) {
    return {
      accepted: false,
      text: trimmed,
      language: chosen.language,
      confidence,
      reason: "language-not-allowed",
    };
  }

  const languageGate = shouldAcceptLanguage(trimmed, chosen.language, confidence, stats, options, context);
  if (!languageGate.accepted) {
    return {
      accepted: false,
      text: trimmed,
      language: chosen.language,
      confidence,
      reason: languageGate.reason,
    };
  }

  return {
    accepted: true,
    text: trimmed,
    language: chosen.language,
    confidence,
    reason: chosen.reason,
  };
}

export function recordAcceptedTranscriptLanguage(
  context: TranscriptLanguageContext,
  decision: TranscriptFilterDecision
): void {
  if (!decision.accepted) return;

  context.recent = [
    ...context.recent,
    {
      language: decision.language,
      confidence: decision.confidence,
      text: decision.text,
    },
  ].slice(-HISTORY_LIMIT);

  const lastSamples = context.recent.slice(-3);
  const lastLanguage = lastSamples[lastSamples.length - 1]?.language;
  const consecutiveCount = lastLanguage
    ? [...lastSamples].reverse().findIndex((sample) => sample.language !== lastLanguage)
    : -1;
  const sameAtEnd = consecutiveCount === -1 ? lastSamples.length : consecutiveCount;

  if (decision.language === context.policy.primaryLanguage && decision.confidence >= 0.55) {
    context.activeLanguage = decision.language;
    return;
  }

  if (lastLanguage === "ja" && sameAtEnd >= 2) {
    context.activeLanguage = "ja";
    return;
  }

  if (lastLanguage === "en" && sameAtEnd >= (context.policy.classroomMode === "english" ? 1 : 2)) {
    context.activeLanguage = "en";
    return;
  }

  if (lastLanguage && !context.policy.priorityLanguages.includes(lastLanguage) && sameAtEnd >= 3) {
    context.activeLanguage = lastLanguage;
  }
}

export function isLikelyTranscriptNoise(
  text: string,
  options: TranscriptNoiseOptions = {}
): boolean {
  return !evaluateTranscriptCandidate(text, { ...options, isFinal: options.isFinal ?? true }).accepted;
}
