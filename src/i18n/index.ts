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

// Chỉ dùng 1 key thống nhất: 'i18nextLng'
const LANGUAGE_KEY = "i18nextLng";
const savedLng = isClient
  ? (localStorage.getItem(LANGUAGE_KEY) ?? "vi")
  : "vi";

const initOptions: Parameters<typeof i18n.init>[0] = {
  resources,
  lng: savedLng,
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

// Persist language choice whenever it changes
if (isClient) {
  i18n.on("languageChanged", (lng) => {
    localStorage.setItem(LANGUAGE_KEY, lng);
  });
}

/**
 * Check if a string looks like a messageKey (e.g., "notification_reminder_1", "auth.loginFail")
 */
function isMessageKey(key: string): boolean {
  // messageKeys follow pattern: module_key or module_subkey (e.g., notification_reminder_1, auth.loginFail)
  // Must contain a dot or underscore and be all alphanumeric with underscores
  return /^[a-zA-Z][a-zA-Z0-9_]*[._][a-zA-Z0-9_]+$/.test(key);
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
export function tMsg(key: string | undefined | null, options?: Record<string, unknown>): string {
  if (!key) return "";

  // If it doesn't look like a messageKey, return as-is (likely actual content from backend)
  if (!isMessageKey(key)) {
    return key;
  }

  // It's a messageKey - try to translate
  const translated = i18n.t(key, { defaultValue: key, ...options });
  return typeof translated === "string" ? translated : key;
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
