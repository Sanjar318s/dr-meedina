import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pearl: "#F6F1EC",
        mist: "#EBE4DB",
        blush: "#F0E6E0",
        charcoal: "#1A1614",
        ink: "#1A1614",
        muted: "#6B635C",
        cream: "#F6F1EC",
        sand: "#8A7F74",
        gold: "#B8956C",
        "gold-dim": "#9A7A52",
        rose: "#C4A090",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
