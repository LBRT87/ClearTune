import type { Config } from "tailwindcss";

// Design tokens mirror /component-reference.html — "pixel system".
// Void base, dual purple accent, green/red/yellow for success/fail/warn.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        ink: "#ffffff",
        dim: "#9a9a9a",
        "purple-dark": "#241033",
        purple: "#8b5cf6",
        green: "#4ade80",
        red: "#ff5c5c",
        yellow: "#ffe14d",
      },
      fontFamily: {
        display: ["var(--font-press-start)", "monospace"],
        mono: ["var(--font-vt323)", "monospace"],
      },
      boxShadow: {
        block: "5px 5px 0 var(--tw-shadow-color)",
        "block-lg": "8px 8px 0 var(--tw-shadow-color)",
      },
    },
  },
  plugins: [],
};
export default config;
