/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#fce588',
          300: '#fadb5f',
          400: '#f7c948',
          500: '#f0b429',
          600: '#de911d',
          700: '#cb6e17',
          800: '#b44d12',
          900: '#8d2b0b',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s ease-out',
      },
    },
  },
  plugins: [],
}
