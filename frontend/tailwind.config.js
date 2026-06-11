/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Primary Blue
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        slate: {
          50: "#0f172a",   // inverted (was near white, now dark)
          100: "#1e293b",  // inverted
          200: "#334155",  // inverted
          300: "#475569",  // inverted
          400: "#64748b",  // inverted
          500: "#94a3b8",  // middle gray
          600: "#cbd5e1",  // light gray border
          700: "#e2e8f0",  // light border
          800: "#f1f5f9",  // very light gray bg/border
          900: "#ffffff",  // white bg/card (was near black)
          950: "#f8fafc",  // light page bg (was deepest black)
        },
        gray: {
          50: "#0f172a",
          100: "#1e293b",
          200: "#334155",
          300: "#475569",
          400: "#64748b",
          500: "#94a3b8",
          600: "#cbd5e1",
          700: "#e2e8f0",
          800: "#f1f5f9",
          900: "#ffffff",
          950: "#f8fafc",
        },
        zinc: {
          50: "#0f172a",
          100: "#1e293b",
          200: "#334155",
          300: "#475569",
          400: "#64748b",
          500: "#94a3b8",
          600: "#cbd5e1",
          700: "#e2e8f0",
          800: "#f1f5f9",
          900: "#ffffff",
          950: "#f8fafc",
        },
        indigo: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        purple: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        dark: {
          50: "#0f172a",
          900: "#ffffff",
          950: "#f8fafc",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
