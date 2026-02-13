"use client";

import { useTranslation } from "react-i18next";

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: "vi" | "en" | "ja") => {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      // Lưu để app khác có thể đọc
      localStorage.setItem("lang", lang);
      // i18next-browser-languagedetector dùng khóa này để khôi phục locale
      localStorage.setItem("i18nextLng", lang);
    }
  };

  const currentLanguage = (i18n.language || "vi").split("-")[0] as
    | "vi"
    | "en"
    | "ja";

  return {
    changeLanguage,
    currentLanguage,
  };
};
