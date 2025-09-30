// Caminho: frontend/src/components/Sidebar.tsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import Icon from './Icon';
import SystemStatusIndicator from './SystemStatusIndicator';
import OnlineUsersDropdown from './OnlineUsersDropdown';

const ICONS = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  obitos: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z",
  launch: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  users: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  access: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  data: "M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm14 14H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  collapse: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  expand: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
};

interface NavButtonProps {
  onClick: () => void; isCollapsed: boolean; isActive: boolean; title: string; children: React.ReactNode; className?: string;
}
const NavButton: React.FC<NavButtonProps> = ({ onClick, isCollapsed, isActive, title, children, className = '' }) => {
  const baseClasses = "w-full flex items-center gap-4 p-3 rounded-md text-left transition-colors duration-200";
  const activeClasses = isActive ? 'bg-blue-600 text-white' : 'text-text hover:bg-gray-700';
  const collapsedClasses = isCollapsed ? "justify-center px-3" : "px-4";
  return (<button onClick={onClick} title={title} className={`${baseClasses} ${activeClasses} ${collapsedClasses} ${className}`}>{children}</button>);
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  closeMobileMenu: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, closeMobileMenu, onLogout }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'Dashboard', adminOnly: false },
    { key: 'report', path: '/relatorio', label: 'Relatório Estatístico', adminOnly: false },
    { key: 'obitos', path: '/relatorio-obitos', label: 'Relatório de Óbitos', adminOnly: false },
    { key: 'launch', path: '/lancamento', label: 'Lançar Ocorrências', adminOnly: false },
    { key: 'users', path: '/gestao-usuarios', label: 'Gerenciar Usuários', adminOnly: true },
    { key: 'access', path: '/gestao-acesso', label: 'Gerenciar Acessos', adminOnly: true },
    { key: 'data', path: '/gestao-dados', label: 'Gerenciar Dados', adminOnly: true },
  ];

  const handleNavigate = (path: string) => { navigate(path); closeMobileMenu(); };
  
  // A função handleLogout foi simplificada para chamar diretamente a prop onLogout
  const handleLogout = () => {
    onLogout();
    closeMobileMenu();
  };

  const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[250px]';

  return (
    <aside className={`flex h-full flex-col bg-surface border-r border-border p-4 transition-all duration-300 ${sidebarWidth}`}>
      <button onClick={() => handleNavigate('/dashboard')} title="Ir para o Dashboard Principal" className={`flex items-center justify-center border-b border-border pb-4 mb-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 invisible' : 'opacity-100 h-[41px] visible'}`}>
        <span className="text-2xl font-bold text-yellow-500">COCB</span>
      </button>

      <nav className="flex flex-col gap-2">
        {navItems.map(item => {
          if (item.adminOnly && usuario?.role !== 'admin') return null;
          return (
            <NavButton key={item.path} onClick={() => handleNavigate(item.path)} isCollapsed={isCollapsed} isActive={location.pathname === item.path} title={item.label}>
              <Icon path={ICONS[item.key as keyof typeof ICONS]} />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
            </NavButton>
          );
        })}
      </nav>

      <div className="flex-grow" />

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <div className={`text-center transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 invisible' : 'opacity-100 visible'}`}>
          <p className="text-sm text-text">Olá, <strong className="font-semibold text-text-strong">{usuario?.nome?.split(' ')[0].toUpperCase() || 'USUÁRIO'}</strong></p>
        </div>

        <OnlineUsersDropdown isCollapsed={isCollapsed} />

        <div className="hidden lg:block">
          <NavButton onClick={() => setIsCollapsed(!isCollapsed)} isCollapsed={isCollapsed} isActive={false} title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}>
            <Icon path={isCollapsed ? ICONS.expand : ICONS.collapse} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>Recolher</span>
          </NavButton>
        </div>

        <SystemStatusIndicator isCollapsed={isCollapsed} />

        <div className="mt-2">
          <NavButton onClick={handleLogout} isCollapsed={isCollapsed} isActive={false} title="Sair" className="!bg-red-600 hover:!bg-red-700 !text-white">
            <Icon path={ICONS.logout} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>Sair</span>
          </NavButton>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
