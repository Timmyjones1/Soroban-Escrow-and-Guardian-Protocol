/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        polaris: {
          dark: "#0a0d14",
          card: "#121824",
          border: "#1e293b",
          primary: "#38bdf8",
          accent: "#818cf8",
          success: "#34d399",
          warning: "#fbbf24",
          danger: "#f87171",
        },
      },
    },
  },
  plugins: [],
};
