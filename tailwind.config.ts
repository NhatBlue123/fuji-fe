import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "selector",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Japanese Minimalism Palette
        charcoal: {
          DEFAULT: "#1A1A1A",
          50: "#2A2A2A",
          100: "#252525",
          200: "#1F1F1F",
          300: "#1A1A1A",
          400: "#151515",
          500: "#0F0F0F",
        },
        navy: {
          DEFAULT: "#0D1117",
          50: "#1A2332",
          100: "#151D2B",
          200: "#111A24",
          300: "#0D1117",
          400: "#0A0D12",
          500: "#080A0E",
        },
        "shun-nuri": {
          DEFAULT: "#A52A2A",
          50: "#F5E6E6",
          100: "#E8CACA",
          200: "#D4A0A0",
          300: "#C07A7A",
          400: "#A52A2A",
          500: "#8B2525",
          600: "#6B1D1D",
          700: "#4A1515",
          800: "#2A0D0D",
          900: "#1A0505",
        },
        washi: {
          DEFAULT: "#F5F0E8",
          50: "#FFFFFF",
          100: "#F5F0E8",
          200: "#E8E0D5",
          300: "#D8CFC2",
        },
        sumi: {
          DEFAULT: "#2C2C2C",
          50: "#4A4A4A",
          100: "#3C3C3C",
          200: "#353535",
          300: "#2C2C2C",
          400: "#1F1F1F",
          500: "#151515",
        },
      },
      fontFamily: {
        mincho: ['"Noto Serif JP"', "serif"],
        sans: ['"Inter"', '"Noto Sans JP"', "sans-serif"],
      },
      spacing: {
        // Japanese "Ma" (間) - intentional breathing space
        ma: "2rem",
        "ma-sm": "1rem",
        "ma-lg": "3rem",
        "ma-xl": "4rem",
      },
      letterSpacing: {
        jp: "0.05em",
        "jp-wide": "0.1em",
      },
      lineHeight: {
        jp: "1.8",
        "jp-relaxed": "2",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "washi": "0 4px 20px rgba(0, 0, 0, 0.3)",
        "shun": "0 0 20px rgba(165, 42, 42, 0.25)",
        "ma": "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
