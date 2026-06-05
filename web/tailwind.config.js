/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#1e293b",
        primary: "#2563eb",
        secondary: "#64748b",
        accent: "#3b82f6",
        muted: "#f1f5f9",
        border: "#e2e8f0",
        card: "#ffffff",
        input: "#e2e8f0",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}