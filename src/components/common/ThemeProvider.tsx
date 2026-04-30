"use client";

import * as React from "react";
import { ThemeProviderProps, ThemeProviderState } from "@/types/common";

type Theme = "dark" | "light" | "system";

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme as Theme);
  const [mounted, setMounted] = React.useState(false);

  // Chỉ đọc localStorage sau khi mount — tránh hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored && ["dark", "light", "system"].includes(stored)) {
        setThemeState(stored);
        // Sync cookie nếu chưa có (user cũ chỉ có localStorage)
        if (!document.cookie.includes("theme=")) {
          document.cookie = `theme=${stored};path=/;max-age=31536000;SameSite=Lax`;
        }
      }
    } catch {}
  }, []);

  // Apply theme class lên <html> sau khi mount
  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none");
      setTimeout(() => root.classList.remove("[&_*]:!transition-none"), 1);
    }

    root.classList.remove("light", "dark");

    const resolved =
      theme === "system" && enableSystem
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(resolved);
  }, [theme, mounted, enableSystem, disableTransitionOnChange]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem("theme", newTheme);
      // Set cookie để server đọc được lần F5 tiếp theo — không flash
      document.cookie = `theme=${newTheme};path=/;max-age=31536000;SameSite=Lax`;
    } catch {}
    setThemeState(newTheme);
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
