// Caminho: frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ======================= INÍCIO DA CORREÇÃO =======================
      colors: {
        // 1. Definimos nomes de cores genéricos que usaremos no código.
        //    Ex: `bg-background`, `text-text`, `border-border`
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-strong': 'var(--color-text-strong)',
        
        // 2. Mantemos as cores específicas que você já usa (opcional, mas bom para consistência)
        //    Isso permite usar classes como `bg-teal-600` normalmente.
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
        // ... outras cores que você usa ...
      }
      // ======================= FIM DA CORREÇÃO =======================
    },
  },
  plugins: [],
}
