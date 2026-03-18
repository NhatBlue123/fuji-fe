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
  // Chỉ dùng LanguageDetector trên browser
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LanguageDetector = require("i18next-browser-languagedetector").default;
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...initOptions,
      detection: {
        order: ["localStorage", "cookie", "navigator", "htmlTag"],
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage", "cookie"],
      },
    });
} else {
  // SSR: không dùng browser detector
  i18n.use(initReactI18next).init(initOptions);
}

export default i18n;


