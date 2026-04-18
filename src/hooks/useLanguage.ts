"use client";

import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/token";

// Chỉ dùng 1 key thống nhất: 'i18nextLng'
const LANGUAGE_KEY = "i18nextLng";

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (lang: "vi" | "en" | "ja") => {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      // Chỉ set 1 key duy nhất
      localStorage.setItem(LANGUAGE_KEY, lang);

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
