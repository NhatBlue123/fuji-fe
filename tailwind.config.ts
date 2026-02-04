import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-sans-jp)", "sans-serif"],
        display: ["var(--font-inter)", "var(--font-noto-sans-jp)", "sans-serif"],
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
          blue: "var(--color-primary-blue)",
          dark: "var(--color-primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
          pink: "var(--color-secondary-pink)",
        },
        aurora: {
          pink: "var(--color-aurora-pink)",
          blue: "var(--color-aurora-blue)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
          bg: "var(--color-card-bg)",
          border: "var(--color-card-border)",
        },
        "background-dark": "var(--color-background-dark)",
        "footer-bg": "var(--color-footer-bg)",
        "sidebar-bg": "var(--color-sidebar-bg)",
        surface: {
          light: "var(--color-surface-light)",
          dark: "var(--color-surface-dark)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        destructive: "var(--color-destructive)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        "text-main": "var(--color-text-main)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
        "100%": { opacity: "1", transform: "translateX(0)" },
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        slideIn: "slideIn 0.2s ease-out",
      },
    },
  },

  plugins: [],
};

export default config;
