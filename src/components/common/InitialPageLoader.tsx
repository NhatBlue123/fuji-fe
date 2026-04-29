"use client";

import { useEffect, useState } from "react";
import { LoadingPage } from "./LoadingPage";

/**
 * Che i18n flash (text tiếng Việt → tiếng Nhật/Anh) trong lúc i18n sync từ localStorage.
 * Theme flash đã được xử lý bằng inline script trong <head>.
 *
 * Chỉ hiển thị nếu ngôn ngữ stored khác với ngôn ngữ mặc định (vi).
 * Nếu user dùng tiếng Việt → không hiển thị gì cả.
 */
export function InitialPageLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Chỉ hiện nếu ngôn ngữ khác vi (tránh flash không cần thiết)
    const storedLang = localStorage.getItem("i18nextLng");
    if (!storedLang || storedLang === "vi") {
      return;
    }

    // Ngôn ngữ khác vi → cần che trong lúc i18n changeLanguage
    setVisible(true);

    // i18n đã sync trong I18nProvider render phase → chỉ cần 1 frame
    const raf = requestAnimationFrame(() => {
      setVisible(false);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "var(--background, #0f0f0f)",
      }}
    />
  );
}
