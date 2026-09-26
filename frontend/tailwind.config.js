/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vividyellow: '#FFD93D',
        hotred: '#FF6B6B',
        softviolet: '#a7a7e6',
        cream: '#FFFDF5',
      }
    },
  },
  plugins: [],
}
