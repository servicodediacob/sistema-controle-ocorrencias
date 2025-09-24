// Caminho: frontend/src/components/ThemeToggle.tsx (CÓDIGO FINAL)

import { useTheme } from '../contexts/ThemeProvider';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-gray-700 p-1">
      <button
        onClick={() => theme !== 'light' && toggleTheme()}
        className={`rounded px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
          theme === 'light' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-600'
        }`}
      >
        Claro
      </button>
      <button
        onClick={() => theme !== 'dark' && toggleTheme()}
        className={`rounded px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-600'
        }`}
      >
        Escuro
      </button>
    </div>
  );
}

export default ThemeToggle;