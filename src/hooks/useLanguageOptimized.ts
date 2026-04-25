"use client";

/**
 * useLanguage Hook - Optimized với localStorage thống nhất
 * 
 * Sử dụng chung 1 key localStorage: 'i18nextLng'
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/token";

// Key thống nhất
const LANGUAGE_KEY = "i18nextLng";

export type SupportedLanguage = "vi" | "en" | "ja";

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      // 1. Change i18next language
      await i18n.changeLanguage(lang);

      // 2. Set localStorage - chỉ 1 key duy nhất
      localStorage.setItem(LANGUAGE_KEY, lang);

      // 3. Sync với backend nếu đã login
      const token = getAccessToken();
      if (token) {
        try {
          await api.put("/users/me/preferences", { language: lang });
        } catch (error) {
          console.error("Failed to sync language preference to backend:", error);
        }
      }
    },
    [i18n]
  );

  const currentLanguage = (i18n.language || "vi").split("-")[0] as SupportedLanguage;

  const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
    return ["vi", "en", "ja"].includes(lang);
  };

  return {
    changeLanguage,
    currentLanguage,
    isSupportedLanguage,
    supportedLanguages: ["vi", "en", "ja"] as SupportedLanguage[],
    LANGUAGE_KEY, // Export để các module khác dùng chung
  };
}

/**
 * Helper để lấy language từ localStorage (dùng trong API layer)
 */
export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "vi";
  
  const stored = localStorage.getItem(LANGUAGE_KEY) || "vi";
  if (["vi", "en", "ja"].includes(stored)) {
    return stored as SupportedLanguage;
  }
  return "vi";
}

/**
 * Language display info
 */
export const LANGUAGE_INFO: Record<
  SupportedLanguage,
  { name: string; nativeName: string; flag: string }
> = {
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  en: { name: "English", nativeName: "English", flag: "🇬🇧" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
};
