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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "vi", // Khởi tạo với 'vi' để khớp với SSR (chống lỗi Hydration)
    fallbackLng: "vi",
    supportedLngs: ["en", "vi", "ja"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
