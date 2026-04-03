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

const initOptions: Parameters<typeof i18n.init>[0] = {
  resources,
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

if (isClient) {
  // Khởi tạo với "vi" để khớp server render, tránh hydration mismatch.
  // I18nProvider sẽ switch sang ngôn ngữ user đã chọn sau khi mount.
  i18n
    .use(initReactI18next)
    .init({ ...initOptions, lng: "vi" });
} else {
  // SSR: luôn dùng "vi"
  i18n.use(initReactI18next).init({ ...initOptions, lng: "vi" });
}

export default i18n;


