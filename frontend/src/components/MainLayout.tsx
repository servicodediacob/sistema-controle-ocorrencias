// Caminho: frontend/src/components/MainLayout.tsx (CORRIGIDO)

import { useState, ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageTitle }) => {
  const { usuario, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // A variável 'sidebarWidthClass' foi removida daqui, pois não era utilizada.

  return (
    <>
      {/* Backdrop para o menu mobile */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-40
          transition-opacity duration-300
          lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className="grid h-screen w-screen grid-cols-[auto_1fr] overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            absolute top-0 left-0 h-full z-50
            transform transition-transform duration-300
            lg:relative lg:transform-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar
            onLogout={logout}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileMenuOpen}
            closeMobileMenu={() => setMobileMenuOpen(false)}
            userName={usuario?.nome}
          />
        </div>

        {/* Contêiner de Conteúdo Principal */}
        <div className="flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <header className="flex h-[73px] flex-shrink-0 items-center justify-between border-b border-gray-700 px-6 md:px-10">
            <div className="flex items-center">
              {/* Botão Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-white lg:hidden"
                aria-label="Abrir menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                </svg>
              </button>
              {/* Título da Página */}
              <h1 className="ml-4 text-2xl font-medium text-gray-200 lg:ml-0 md:text-3xl">
                {pageTitle}
              </h1>
            </div>
          </header>

          {/* Corpo da Página */}
          <main className="flex-grow overflow-y-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
