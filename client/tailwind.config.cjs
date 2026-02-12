/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
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
        },
        brand: {
          50: "#f8faf5",
          100: "#eef2e8",
          200: "#dde6d1",
          300: "#c2d3ac",
          400: "#a3bc82",
          500: "#85a55e",
          600: "#6b8a47",
          700: "#546c38",
          800: "#455730",
          900: "#3b4a2a",
        },
        surface: {
          50: "#fafaf7",
          100: "#f5f3ee",
          200: "#eae5da",
          300: "#ddd5c4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
