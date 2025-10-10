// frontend/src/components/Sidebar.tsx

import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import {
  LayoutDashboard, BarChart3, FileText, FilePlus, Users, UserCheck,
  Database, ShieldAlert, UserCircle, ChevronDown, ChevronUp, LogOut,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import SystemStatusIndicator from './SystemStatusIndicator';

// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Definir a interface para as props que o Sidebar recebe.
interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  closeMobileMenu: () => void;
}

// Componente para os links do menu
const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; isCollapsed: boolean; onClick: () => void; }> = ({ to, icon, label, isCollapsed, onClick }) => {
  const navLinkClasses = "flex items-center gap-4 rounded-md px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-gray-700";
  const activeClasses = "bg-blue-700 text-white";

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `${navLinkClasses} ${isActive ? activeClasses : ''} ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      {!isCollapsed && <span className="font-medium">{label}</span>}
    </NavLink>
  );
};

// 2. Aplicar a interface de props ao componente Sidebar.
const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, setIsCollapsed, closeMobileMenu }) => {
// ======================= FIM DA CORREÇÃO =======================
  const { user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(!isCollapsed);

  React.useEffect(() => {
    setIsUserMenuOpen(!isCollapsed);
  }, [isCollapsed]);

  return (
    <aside className={`flex h-screen flex-col bg-gray-800 text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-[73px] items-center justify-center border-b border-gray-700">
        <Link to="/dashboard" className="text-2xl font-bold text-white" onClick={closeMobileMenu}>
          {isCollapsed ? 'O' : 'COCB'}
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-2">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
        <NavItem to="/relatorio-estatistico" icon={<BarChart3 size={20} />} label="Relatório Estatístico" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
        <NavItem to="/relatorio-obitos" icon={<FileText size={20} />} label="Relatório de Óbitos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
        <NavItem to="/lancar-ocorrencias" icon={<FilePlus size={20} />} label="Lançar Ocorrências" isCollapsed={isCollapsed} onClick={closeMobileMenu} />

        {(user?.role === 'admin' || user?.perfil === 'admin') && (
          <>
            <div className="px-3 pt-4 pb-2">
              <span className={`text-xs font-semibold uppercase text-gray-400 ${isCollapsed ? 'hidden' : 'block'}`}>
                Admin
              </span>
            </div>
            <NavItem to="/gerenciar-usuarios" icon={<Users size={20} />} label="Gerenciar Usuários" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            <NavItem to="/gerenciar-acessos" icon={<UserCheck size={20} />} label="Gerenciar Acessos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            <NavItem to="/gerenciar-dados" icon={<Database size={20} />} label="Gerenciar Dados" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            <NavItem to="/auditoria" icon={<ShieldAlert size={20} />} label="Logs de Auditoria" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
          </>
        )}
      </nav>

      <div className="border-t border-gray-700 p-2">
        <div className="mb-2">
          <SystemStatusIndicator isCollapsed={isCollapsed} />
        </div>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="flex items-center gap-3">
            <UserCircle size={24} />
            {!isCollapsed && <span className="font-semibold truncate">{user?.nome || 'Usuário'}</span>}
          </div>
          {!isCollapsed && (isUserMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
        </button>

        {isUserMenuOpen && !isCollapsed && (
          <div className="mt-2 space-y-2">
            <NavItem to="/meu-perfil" icon={<UserCircle size={20} />} label="Meu Perfil" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-4 rounded-md bg-red-800/50 px-3 py-2.5 text-left text-red-300 transition-all duration-200 hover:bg-red-700 hover:text-white"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-4 rounded-md p-2 mt-2 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
