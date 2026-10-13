/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parsec: {
          bg: '#0F1115',
          sidebar: '#161920',
          card: '#1F242E',
          accent: '#F74C40',
          hover: '#2A303D',
          text: '#FFFFFF',
          muted: '#8A92A6'
        }
      }
    },
  },
  plugins: [],
}
