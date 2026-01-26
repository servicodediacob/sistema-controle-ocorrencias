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

      <div className={`relative grid h-screen w-screen grid-cols-[auto_1fr] overflow-hidden bg-obsidian text-white font-rajdhani transition-all duration-300 ease-out ${shouldEnterAnim ? (entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6') : ''}`}>

        {/* Background Grid/Effects - Global */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-50"></div>
          <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 to-black"></div>
        </div>

        {/* Watermark 1 - Top Left (Lighter) */}
        <div className="fixed top-0 left-0 z-0 opacity-20 pointer-events-none mix-blend-overlay -translate-x-1/2 -translate-y-1/2">
          <img
            src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
            alt="Watermark TL"
            className="w-[700px] h-auto"
            style={{
              clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)'
            }}
          />
        </div>

        {/* Watermark 2 - Bottom Right (Standard) */}
        <div className="fixed bottom-0 right-0 z-0 opacity-20 pointer-events-none mix-blend-overlay translate-x-1/2 translate-y-1/2">
          <img
            src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
            alt="Watermark BR"
            className="w-[700px] h-auto"
            style={{
              clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)'
            }}
          />
        </div>

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

        <div className="flex flex-col overflow-hidden relative z-10">
          <header className="relative flex h-[73px] flex-shrink-0 items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 md:px-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20">
            {/* Header Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>

            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-white lg:hidden"
                aria-label="Abrir menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                </svg>
              </button>
              {pageTitle && (
                <div className="ml-4 lg:ml-0 flex flex-col">
                  <h1 className="text-2xl font-bold text-white md:text-3xl font-orbitron tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {pageTitle}
                  </h1>
                  <div className="h-[2px] w-12 bg-neon-blue mt-1 shadow-[0_0_8px_#00f3ff]"></div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <OnlineUsersPopover />
            </div>
          </header>

          <main className="flex-grow overflow-auto bg-transparent p-6 md:p-8 custom-scrollbar relative">
            {/* Content Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-20 bg-neon-blue/5 blur-[100px] pointer-events-none rounded-full"></div>
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
