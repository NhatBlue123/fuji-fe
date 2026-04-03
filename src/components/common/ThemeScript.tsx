"use client";

import Script from "next/script";

/**
 * Client Component wrapper cho theme init script.
 * Đặt trong Client Component để tránh React Server Component
 * warning "Encountered a script tag while rendering".
 * strategy="beforeInteractive" đảm bảo script chạy trước hydration.
 */
export function ThemeScript() {
  return (
    <Script
      id="theme-init"
      src="/theme-init.js"
      strategy="beforeInteractive"
    />
  );
}
