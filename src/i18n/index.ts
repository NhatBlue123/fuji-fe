/**
 * i18n Configuration - Optimized for Code Splitting
 * 
 * Sử dụng cấu trúc nested keys từ translation.json gốc
 * Cấu hình tối ưu cho lazy loading theo route
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import vi from "./locales/vi/translation.json";
import ja from "./locales/ja/translation.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  ja: { translation: ja },
};

const isClient = typeof window !== "undefined";

// Init với "vi" cố định — giống server render.
// I18nProvider nhận initialLng từ server (cookie) và set đúng ngôn ngữ
// trước khi React render bất kỳ component nào.
const initOptions: Parameters<typeof i18n.init>[0] = {
  resources,
  lng: "vi",
  fallbackLng: "vi",
  supportedLngs: ["en", "vi", "ja"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};

i18n
  .use(initReactI18next)
  .init(initOptions);




/**
 * Check if a string looks like a messageKey (e.g., "notification_reminder_1", "auth.loginFail")
 */
function isMessageKey(key: string): boolean {
  // messageKeys follow pattern: module_key or module_subkey (e.g., notification_reminder_1, auth.loginFail)
  // Must contain a dot or underscore and be all alphanumeric with underscores
  return /^[a-zA-Z][a-zA-Z0-9_]*[._][a-zA-Z0-9_]+$/.test(key);
}

function normalizeMessageKey(input: unknown, seen = new WeakSet<object>()): string {
  if (input == null) return "";

  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizeMessageKey(item, seen)).filter(Boolean).join(", ");
  }

  if (typeof input !== "object") return "";
  if (seen.has(input)) return "";
  seen.add(input);

  const payload = input as {
    messageKey?: unknown;
    message?: unknown;
    code?: unknown;
    error?: unknown;
  };

  return (
    normalizeMessageKey(payload.messageKey, seen) ||
    normalizeMessageKey(payload.message, seen) ||
    normalizeMessageKey(payload.error, seen) ||
    normalizeMessageKey(payload.code, seen)
  );
}

/**
 * [FRONTEND I18N ROLE] Global helper for standardized translation with debugging.
 * Ensures fallback to the key itself and warns if a key is missing in development.
 * This is the SINGLE SOURCE OF TRUTH for resolving backend messageKeys.
 * 
 * - If key looks like a messageKey (notification_reminder_1), try to translate
 * - If key doesn't exist, return key silently (for content from backend)
 * - If key is actual content (not a messageKey), return as-is without warning
 */
export function tMsg(key: unknown, options?: Record<string, unknown>): string {
  const normalizedKey = normalizeMessageKey(key);
  if (!normalizedKey) return "";

  // If it doesn't look like a messageKey, return as-is (likely actual content from backend)
  if (!isMessageKey(normalizedKey)) {
    return normalizedKey;
  }

  // It's a messageKey - try to translate
  const translated = i18n.t(normalizedKey, { defaultValue: normalizedKey, ...options });
  return typeof translated === "string" ? translated : normalizedKey;
}

/**
 * Namespace groups for lazy loading - Import chỉ namespaces cần thiết cho route
 */
export const NAMESPACE_GROUPS = {
  // User routes - các route phổ biến
  user: ["common", "auth", "home", "course", "flashcard", "flashcards", "flashlist", "booking", "wallet", "settings", "profile", "notifications", "premium", "paywall", "ai", "jlpt", "api", "prefs", "user", "reports", "sidebar", "languageSwitcher", "video_call", "videoCall", "header", "lesson", "feedback"],
  
  // Admin routes - chỉ admin cần
  admin: ["admin", "common", "settings", "notifications"],
  
  // Auth routes - chỉ auth cần  
  auth: ["common", "auth", "home", "sidebar", "languageSwitcher"],
  
  // Course routes
  course: ["common", "course", "flashcard", "flashcards", "flashlist", "jlpt", "api"],
  
  // Booking routes
  booking: ["common", "booking", "course", "wallet", "payment", "settings"],
  
  // AI routes
  ai: ["common", "ai", "course", "settings"],
  
  // Payment/Wallet routes
  payment: ["common", "wallet", "payment", "premium", "settings", "api"],
  
  // Video call routes
  videoCall: ["common", "video_call", "videoCall", "lesson", "settings", "feedback"],
} as const;

/**
 * Type for namespace groups
 */
export type NamespaceGroup = keyof typeof NAMESPACE_GROUPS;

export default i18n;
