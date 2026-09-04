import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink:    { 300: "#9BA3A6", 500: "#5A6266", 700: "#2A3033", 900: "#14181A" },
        lagoon: { 50: "#E4F2F0", 300: "#6FC7BF", 500: "#2E9E99", 800: "#0E5E5C" },
        brass:  { 200: "#E8D9AE", 400: "#C9A24B", 600: "#8C6C28" },
        teak:   { 200: "#D8B28C", 600: "#8B4A2B" },
        shell:  "#FAF8F5",
        sand:   "#F0EDE8",
        stone:  "#DDD9D2",
      },
      fontFamily: {
        sans:    ["var(--font-jost)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
        hero:    ["4.75rem",   { lineHeight: "1.02", letterSpacing: "-0.015em" }],
      },
      borderRadius: { sm: "2px", DEFAULT: "2px", md: "4px", lg: "4px" },
      boxShadow: {
        soft: "0 2px 10px rgba(20,24,26,0.05)",
        lift: "0 10px 34px rgba(20,24,26,0.10)",
      },
      spacing: { section: "7rem", "section-lg": "8.75rem" },
      maxWidth: { content: "74rem", prose: "42rem" },
      transitionTimingFunction: { calm: "cubic-bezier(0.22,0.61,0.36,1)" },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) both" },
    },
  },
  plugins: [],
};

export default config;
