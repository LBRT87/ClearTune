import type { Config } from "tailwindcss";

/**
 * Token dari .scratch/landing-page/issues/03-design-tokens.md
 * Landing page sendiri memakai class di globals.css (sistemnya digerakkan
 * custom property, bukan utility). Tailwind di sini disiapkan untuk halaman
 * app besok, supaya token-nya sudah satu sumber sejak awal.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        surface: "#0a0a0a",
        "surface-2": "#141414",
        ink: "#ffffff",
        dim: "#9a9a9a",
        dimmer: "#5a5a5a",
        hairline: "#2e2e2e",
        purple: { DEFAULT: "#8b5cf6", dark: "#241033" },
        green: "#4ade80",
        red: "#ff5c5c",
        yellow: "#ffe14d",
      },
      fontFamily: {
        px: ["var(--font-px)", "monospace"],
        tx: ["var(--font-tx)", "monospace"],
      },
      spacing: {
        s1: "8px", s2: "16px", s3: "24px",
        s4: "40px", s5: "64px", s6: "96px", s7: "144px",
      },
      maxWidth: { measure: "46ch", shell: "1180px" },
    },
  },
  plugins: [],
};

export default config;
