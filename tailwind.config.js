/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#182951',
          gold: '#F4B639',
        },
      },
    },
  },
  plugins: [],
}
