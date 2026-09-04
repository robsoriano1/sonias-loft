import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* "Loft after dark" - deep poolside-at-dusk palette. Numeric keys keep
           the OLD relative role (900/800 = strongest accent, 300/50 = faintest)
           even though the literal lightness direction flips versus the old
           daylight theme - every component already reasons in those roles. */
        ink:    { 300: "#5E5648", 500: "#A79C89", 700: "#D9CFBC", 900: "#F4EDDF" },
        lagoon: { 50: "#12312C", 300: "#3FC6B2", 500: "#4FE1CB", 800: "#5EF2DB" },
        brass:  { 200: "#5C4726", 400: "#DDA753", 600: "#F2C87C" },
        teak:   { 200: "#3C2216", 600: "#E38F5F" },
        shell:  "#0C1614",
        sand:   "#15211E",
        stone:  "#2B3B36",
      },
      fontFamily: {
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
        hero:    ["4.75rem",   { lineHeight: "1.02", letterSpacing: "-0.015em" }],
      },
      borderRadius: { sm: "2px", DEFAULT: "2px", md: "4px", lg: "4px" },
      boxShadow: {
        soft: "0 2px 16px rgba(0,0,0,0.35)",
        lift: "0 20px 60px -12px rgba(79,225,203,0.14), 0 10px 30px -8px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(94,242,219,0.18), 0 0 40px rgba(94,242,219,0.10)",
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
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,0.61,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
