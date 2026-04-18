/**
 * [LUỒNG I18N QUỐC TẾ HÓA - FRONTEND]
 * File này khởi tạo i18next cho toàn bộ ứng dụng Fuji.
 * - Hỗ trợ 3 ngôn ngữ: vi, en, ja.
 * - Lưu lựa chọn ngôn ngữ vào localStorage (fuji_lang).
 * - Cung cấp hàm tMsg(): Helper quan trọng nhất để dịch các 'messageKey' được gửi từ Backend.
 * - Luồng: Backend trả về key (vd: 'auth.loginSuccess') -> tMsg(key) -> Lấy chuỗi từ translation.json.
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

// Restore saved language from localStorage, default to 'vi'
const savedLng = isClient
  ? (localStorage.getItem("fuji_lang") ?? "vi")
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
    localStorage.setItem("fuji_lang", lng);
  });
}

/**
 * [FRONTEND I18N ROLE] Global helper for standardized translation with debugging.
 * Ensures fallback to the key itself and warns if a key is missing in development.
 * This is the SINGLE SOURCE OF TRUTH for resolving backend messageKeys.
 */
export function tMsg(key: string | undefined | null, options?: any): string {
  if (!key) return "";

  if (process.env.NODE_ENV === "development" && !i18n.exists(key)) {
    console.warn("Missing i18n key:", key);
  }

  const translated = i18n.t(key, { defaultValue: key, ...options });
  return typeof translated === "string" ? translated : key;
}

export default i18n;
