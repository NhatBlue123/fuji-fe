import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        },
        "background-dark": "var(--color-background-dark)",
        "footer-bg": "var(--color-footer-bg)",
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
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        DEFAULT: "var(--radius-DEFAULT)",
        full: "var(--radius-full)",
      },
      animation: {
        "aurora-flow-1": "auroraFlow1 12s ease-in-out infinite alternate",
        "aurora-flow-2": "auroraFlow2 15s ease-in-out infinite alternate",
        "pulse-glow": "pulseGlow 6s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-in": "fade-in 1s ease-out",
        "fade-in-right": "fadeInRight 0.5s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        auroraFlow1: {
          "0%": { transform: "rotate(15deg) scale(1) translate(0, 0)" },
          "100%": { transform: "rotate(20deg) scale(1.1) translate(-2%, -5%)" },
        },
        auroraFlow2: {
          "0%": { transform: "rotate(-10deg) scale(1) translate(0, 0)" },
          "100%": { transform: "rotate(-5deg) scale(1.1) translate(2%, 5%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
