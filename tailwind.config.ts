import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A3C6E",
          50: "#EEF3FA",
          100: "#D4E0F3",
          200: "#A9C2E7",
          300: "#7EA3DB",
          400: "#5385CF",
          500: "#1A3C6E",
          600: "#163260",
          700: "#112752",
          800: "#0D1D3F",
          900: "#081230",
        },
        accent: {
          DEFAULT: "#D0342C",
          light: "#F9E5E4",
        },
        editorial: {
          DEFAULT: "#E8630A",
          light: "#FEF0E6",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF9C3",
        },
        surface: "#F8F9FC",
        card: "#FFFFFF",
        muted: "#6B7280",
        border: "#E5E7EB",
        "editorial-bg": "#FAFAF8",
      },
      fontFamily: {
        heading: ["var(--font-merriweather)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        full: "9999px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        none: "none",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "ticker": "ticker 40s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
