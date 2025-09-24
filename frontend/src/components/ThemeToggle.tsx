// Caminho: frontend/src/components/ThemeToggle.tsx

import React from 'react';
import { useTheme } from '../contexts/ThemeProvider';
import Icon from './Icon';

// Ícones para o sol (light mode) e a lua (dark mode)
const ICONS = {
  lightMode: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.64 5.64c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L5.64 5.64zm12.73 12.73c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.41-1.41zM4.22 18.36l1.41-1.41c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-1.41 1.41c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0zM18.36 4.22l1.41 1.41c.39.39.39 1.02 0 1.41s-1.02-.39-1.41 0l-1.41-1.41c-.39-.39-.39-1.02 0-1.41s1.02-.39 1.41 0z",
  darkMode: "M9.37 5.51c-.18.64.29 1.28.94 1.46.65.18 1.28-.29 1.46-.94-.18-.64-.29-1.28-.94-1.46-.65-.18-1.28.29-1.46.94zM12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
};

interface ThemeToggleProps {
  isCollapsed: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // ======================= INÍCIO DA CORREÇÃO =======================
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      // 1. Container principal: define a forma e esconde o conteúdo que transborda
      className="relative flex h-10 w-full items-center rounded-full bg-gray-200 p-1 dark:bg-gray-700"
    >
      {/* 2. Círculo seletor: a "bolinha" que desliza */}
      <div
        className={`absolute h-8 w-1/2 transform rounded-full bg-white shadow-md transition-transform duration-300 dark:bg-gray-600
          ${isDark ? 'translate-x-[calc(100%-0.25rem)]' : 'translate-x-0'}`}
      />

      {/* 3. Container para os ícones e textos */}
      <div className="relative z-10 flex flex-1 items-center justify-around">
        {/* Ícone e Texto do Modo Claro */}
        <div className={`flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-yellow-500'}`}>
          <Icon path={ICONS.lightMode} size={20} />
          {!isCollapsed && <span className="text-sm font-semibold">Claro</span>}
        </div>

        {/* Ícone e Texto do Modo Escuro */}
        <div className={`flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-gray-500'}`}>
          {!isCollapsed && <span className="text-sm font-semibold">Escuro</span>}
          <Icon path={ICONS.darkMode} size={20} />
        </div>
      </div>
    </button>
  );
  // ======================= FIM DA CORREÇÃO =======================
};

export default ThemeToggle;
