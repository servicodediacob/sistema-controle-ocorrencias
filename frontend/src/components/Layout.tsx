// frontend/src/components/Layout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthProvider';

const Layout: React.FC = () => {
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Adicionar lógica de confirmação se necessário
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Overlay para o menu mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-40 h-full transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeMobileMenu={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[73px] flex-shrink-0 items-center border-b border-gray-700 px-6 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
