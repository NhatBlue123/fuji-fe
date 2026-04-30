"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
  initialLng: string;
}

export function I18nProvider({ initialLng, children }: I18nProviderProps) {
  // Set ngôn ngữ đúng ngay trong render phase — trước khi React commit bất kỳ DOM nào.
  // initialLng đến từ server (đọc cookie), nên server và client render giống nhau.
  if (i18n.language !== initialLng) {
    i18n.changeLanguage(initialLng);
  }

  useEffect(() => {
    // Đảm bảo cookie luôn tồn tại cho server render lần sau
    const lang = localStorage.getItem("i18nextLng") ?? initialLng;
    document.cookie = `i18nextLng=${lang};path=/;max-age=31536000;SameSite=Lax`;
  }, [initialLng]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
