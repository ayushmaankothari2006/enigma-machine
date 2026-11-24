/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cascadia Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
        mono: ['"Cascadia Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
