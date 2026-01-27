/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: '#F9E7D4',
        rose: '#F5B6A5',
        mint: '#62C9A9',
        lavender: '#9E8BFF',
        ink: '#4A4A4A',
        mist: '#D4D4D4',
        card: '#FFFFFF',
        'pastel-beige': '#F9E7D4',
        'pastel-pink': '#F5B6A5',
        'mint-green': '#62C9A9',
        'lavender': '#9E8BFF',
        'dark-gray': '#4A4A4A',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
