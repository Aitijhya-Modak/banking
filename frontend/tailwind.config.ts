// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#020617", // slate-950 (Primary background)
          card: "#0f172a", // slate-900 (Surface / Input background)
          border: "#1e293b", // slate-800 (Borders / Dividers)
          accent: "#0ea5e9", // sky-500   (Buttons / Highlights)
          "accent-hover": "#38bdf8", // sky-400
          text: "#f8fafc", // slate-100 (Primary text)
          muted: "#94a3b8", // slate-400 (Secondary text)
        },
      },
    },
  },
  plugins: [],
};
