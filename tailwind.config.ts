import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d8e0",
          300: "#a9b0bd",
          400: "#737d8e",
          500: "#4a5468",
          600: "#323a4b",
          700: "#22293a",
          800: "#161b29",
          900: "#0b0e18",
          950: "#05070d",
        },
        accent: {
          DEFAULT: "#c8a560",
          soft: "#e6d3a3",
          deep: "#8a6f3a",
        },
        emerald: {
          glow: "#34d399",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 30px 60px -20px rgba(0,0,0,0.6), 0 8px 24px -12px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(200,165,96,0.35), 0 12px 40px -12px rgba(200,165,96,0.35)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")",
        "grad-radial":
          "radial-gradient(circle at 20% 0%, rgba(200,165,96,0.14), transparent 50%), radial-gradient(circle at 80% 100%, rgba(52,211,153,0.10), transparent 55%)",
      },
      animation: {
        "fade-in": "fadeIn 400ms ease-out both",
        "slide-up": "slideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "shimmer": "shimmer 2.4s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
