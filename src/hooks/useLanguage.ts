"use client";

import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/token";

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (lang: "vi" | "en" | "ja") => {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      // Lưu để app khác có thể đọc
      localStorage.setItem("lang", lang);
      // i18next-browser-languagedetector dùng khóa này để khôi phục locale
      localStorage.setItem("i18nextLng", lang);

      // Đồng bộ với backend nếu đã đăng nhập
      const token = getAccessToken();
      if (token) {
        try {
          await api.put("/users/me/preferences", { language: lang });
        } catch (error) {
          console.error("Failed to sync language preference to backend:", error);
        }
      }
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
