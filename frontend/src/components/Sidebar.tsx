import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

// Componente de Ícone SVG (sem alterações)
const Icon = ({ path, size = 24 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
    <path d={path}></path>
  </svg>
);

// Mapeamento de ícones (sem alterações)
const ICONS = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  obitos: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  launch: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  manage: "M14.06 9.94L15.12 11l-4.18 4.17-1.42-1.42 4.52-4.52zM20.5 2c-3.04 0-5.5 2.46-5.5 5.5 0 1.02.28 1.97.75 2.8l-5.81 5.81-2.12-2.12-5.3 5.3L4.22 21l5.3-5.3 2.12 2.12 5.81-5.81c.83.47 1.78.75 2.8.75 3.04 0 5.5-2.46 5.5-5.5S23.54 2 20.5 2z",
  users: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  access: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  data: "M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm14 14H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  collapse: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  expand: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
};

// Componente de Botão de Navegação (sem alterações na interface)
interface NavButtonProps {
  onClick: () => void;
  isCollapsed: boolean;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, isCollapsed, isActive, title, children, className = '' }) => {
  const baseClasses = "w-full flex items-center gap-4 p-3 rounded-md text-white text-left transition-colors duration-200";
  const activeClasses = isActive ? "bg-blue-700" : "hover:bg-gray-700";
  const collapsedClasses = isCollapsed ? "justify-center px-3" : "px-4";

  return (
    <button onClick={onClick} title={title} className={`${baseClasses} ${activeClasses} ${collapsedClasses} ${className}`}>
      {children}
    </button>
  );
};

// Componente Principal da Sidebar (COM A CORREÇÃO)
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  closeMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, closeMobileMenu }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard, adminOnly: false },
    { path: '/relatorio', label: 'Relatório Estatístico', icon: ICONS.report, adminOnly: false },
    { path: '/relatorio-obitos', label: 'Relatório de Óbitos', icon: ICONS.obitos, adminOnly: false },
    { path: '/lancamento', label: 'Lançar Ocorrências', icon: ICONS.launch, adminOnly: false },
    { path: '/gestao-ocorrencias', label: 'Gerenciar Ocorrências', icon: ICONS.manage, adminOnly: true },
    { path: '/gestao-usuarios', label: 'Gerenciar Usuários', icon: ICONS.users, adminOnly: true },
    { path: '/gestao-acesso', label: 'Gerenciar Acessos', icon: ICONS.access, adminOnly: true },
    { path: '/gestao-dados', label: 'Gerenciar Dados', icon: ICONS.data, adminOnly: true },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[250px]';

  return (
    <aside className={`flex h-full flex-col bg-gray-800 border-r border-gray-700 p-4 transition-all duration-300 ${sidebarWidth}`}>
      <button onClick={() => handleNavigate('/dashboard')} title="Ir para o Dashboard Principal" className={`flex items-center justify-center border-b border-gray-700 pb-4 mb-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 invisible' : 'opacity-100 h-[41px] visible'}`}>
        <span className="text-2xl font-bold text-yellow-500">COCB</span>
      </button>

      <nav className="flex flex-col gap-2">
        {navItems.map(item => {
          if (item.adminOnly && usuario?.role !== 'admin') {
            return null;
          }
          return (
            <NavButton key={item.path} onClick={() => handleNavigate(item.path)} isCollapsed={isCollapsed} isActive={location.pathname === item.path} title={item.label}>
              <Icon path={item.icon} />
              {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
              <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                {item.label}
              </span>
              {/* ======================= FIM DA CORREÇÃO ======================= */}
            </NavButton>
          );
        })}
      </nav>

      <div className="flex-grow" />

      <div className={`border-t border-gray-700 pt-4 mt-4 text-center transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 invisible' : 'opacity-100 visible'}`}>
        <p className="text-sm text-gray-400">Olá, <strong className="font-semibold text-white">{usuario?.nome?.split(' ')[0].toUpperCase() || 'USUÁRIO'}</strong></p>
      </div>

      <div className="hidden lg:block mt-4">
        <NavButton onClick={() => setIsCollapsed(!isCollapsed)} isCollapsed={isCollapsed} isActive={false} title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}>
          <Icon path={isCollapsed ? ICONS.expand : ICONS.collapse} />
          {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
            Recolher
          </span>
          {/* ======================= FIM DA CORREÇÃO ======================= */}
        </NavButton>
      </div>

      <div className="mt-2">
        <NavButton onClick={handleLogout} isCollapsed={isCollapsed} isActive={false} title="Sair" className="!bg-red-600 hover:!bg-red-700">
          <Icon path={ICONS.logout} />
          {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
            Sair
          </span>
          {/* ======================= FIM DA CORREÇÃO ======================= */}
        </NavButton>
      </div>
    </aside>
  );
};

export default Sidebar;
