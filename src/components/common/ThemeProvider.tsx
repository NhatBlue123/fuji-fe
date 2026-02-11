"use client";

import * as React from "react";
import { ThemeProviderProps, ThemeProviderState } from "@/types/common";

type Theme = "dark" | "light" | "system";

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined);

// Hàm lấy theme từ localStorage hoặc system preference (chỉ chạy client-side)
const getInitialTheme = (defaultTheme: Theme, enableSystem: boolean): Theme => {
  if (typeof window === "undefined") return defaultTheme;

  try {
    const stored = localStorage.getItem("theme") as Theme;
    if (stored) return stored;

    if (enableSystem) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
  } catch (e) {
    console.error("Error reading theme:", e);
  }

  return defaultTheme;
};

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  // Khởi tạo theme ngay từ đầu bằng cách đọc localStorage (chỉ chạy một lần khi mount)
  const [theme, setThemeState] = React.useState<Theme>(() =>
    getInitialTheme(defaultTheme, enableSystem),
  );

  React.useEffect(() => {
    const root = window.document.documentElement;

    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none");
      window.setTimeout(() => {
        root.classList.remove("[&_*]:!transition-none");
      }, 1);
    }

    root.classList.remove("light", "dark");

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, enableSystem, disableTransitionOnChange]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
