// frontend/src/contexts/ThemeProvider.tsx

import React, { useEffect, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

// O provedor agora tem uma única responsabilidade:
// garantir que o tema escuro seja aplicado na inicialização.
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Limpa qualquer classe de tema anterior e adiciona 'dark' permanentemente.
    root.classList.remove('claro', 'escuro');
    root.classList.add('dark');

    // Remove a preferência salva, pois não é mais necessária.
    localStorage.removeItem('theme');
  }, []); // Executa apenas uma vez, quando o aplicativo é montado.

  // O provedor simplesmente renderiza os filhos, sem passar nenhum valor de contexto.
  return <>{children}</>;
};
