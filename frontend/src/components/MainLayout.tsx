// frontend/src/components/MainLayout.tsx

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthProvider'; // 1. Importar o useAuth
import Sidebar from './Sidebar';
import OnlineUsersPopover from './OnlineUsersPopover';
import ChatContainer from './ChatContainer';
import OfflineIndicator from './OfflineIndicator';

interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageTitle }) => {
  // ======================= INÍCIO DA CORREÇÃO =======================
  const { logout } = useAuth(); // 2. Obter a função de logout correta
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Animação de entrada ao vir do login
  const [shouldEnterAnim, setShouldEnterAnim] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    try {
      if (sessionStorage.getItem('systemEnterAnim')) {
        sessionStorage.removeItem('systemEnterAnim');
        setShouldEnterAnim(true);
        setEntered(false);
        t = window.setTimeout(() => setEntered(true), 30);
      } else {
        setShouldEnterAnim(false);
        setEntered(true);
      }
    } catch {
      setEntered(true);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, []);
  // ======================= FIM DA CORREÇÃO =======================

  return (
    <>
      <div
        className={`
          fixed inset-y-0 right-0 bg-black/70 backdrop-blur-sm z-40
          transition-[opacity,left] duration-300 ease-out
          lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        // Deixa livre a área do sidebar (não cobre o lado esquerdo)
        style={{ left: isMobileMenuOpen ? (isCollapsed ? '5rem' : '16rem') as any : '0' }}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className={`grid h-screen w-screen grid-cols-[auto_1fr] overflow-hidden bg-background text-text transition-all duration-300 ease-out ${shouldEnterAnim ? (entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6') : ''}`}>
        <div
          className={`
            fixed top-0 left-0 h-full z-[60]
            transform transition-transform duration-300
            lg:relative lg:transform-none lg:z-auto
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar
            onLogout={logout}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            closeMobileMenu={() => setMobileMenuOpen(false)}
          />
        </div>

        <div className="flex flex-col overflow-hidden">
          <header className="flex h-[73px] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 md:px-10 shadow-[0_15px_35px_rgba(0,0,0,0.45)]">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-text-strong lg:hidden"
                aria-label="Abrir menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                </svg>
              </button>
              {pageTitle && (
                <h1 className="ml-4 text-2xl font-medium text-text-strong lg:ml-0 md:text-3xl">
                  {pageTitle}
                </h1>
              )}
            </div>
            
            <div className="flex items-center">
              <OnlineUsersPopover />
            </div>
          </header>

          <main className="flex-grow overflow-auto bg-background-alt p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
      <ChatContainer />
      <OfflineIndicator />
    </>
  );
};

export default MainLayout;
