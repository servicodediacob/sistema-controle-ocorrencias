// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // A linha 'darkMode: 'class',' foi removida.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-strong': 'var(--color-text-strong)',
        
        teal: {
          300: '#81e6d9',
          400: '#4fd1c5',
          600: '#319795',
          700: '#2c7a7b',
        },
        yellow: {
          400: '#f6e05e',
          500: '#ecc94b',
          600: '#d69e2e',
          700: '#b7791f',
        },
        orange: {
          600: '#dd6b20',
          700: '#c05621',
        },
      }
    },
  },
  plugins: [],
}
