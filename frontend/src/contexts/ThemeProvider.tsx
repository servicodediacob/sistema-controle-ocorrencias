// Caminho: frontend/src/contexts/ThemeProvider.tsx

import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react';

// Define os tipos para o tema e o contexto
type Theme = 'light' | 'dark';

interface IThemeContext {
  theme: Theme;
  toggleTheme: () => void;
}

// Cria o contexto
const ThemeContext = createContext<IThemeContext | null>(null);

// Hook para consumir o contexto
export const useTheme = (): IThemeContext => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Esta é a mensagem de erro que você está vendo no console
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Componente Provedor
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Tenta obter o tema do localStorage ou usa 'escuro' como padrão
    const storedTheme = localStorage.getItem('theme');
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
  });

  // Efeito para atualizar a classe no body e salvar no localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // O valor do contexto que será passado para os componentes filhos
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};