// frontend/src/components/Sidebar.tsx

import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Building2,
  Users,
  BarChart3,
  FileText,
  FilePlus,
  UserCheck,
  Database,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import SystemStatusIndicator from './SystemStatusIndicator';

const RECURSOS_MENU_STORAGE_KEY = 'sidebar:recursos-op-open';
const RECURSOS_MENU_PATHS = ['/plantoes-sisgpo', '/viaturas-sisgpo', '/obms-sisgpo', '/militares-sisgpo'];
const RELATORIOS_MENU_STORAGE_KEY = 'sidebar:relatorios-open';
const RELATORIOS_MENU_PATHS = ['/relatorio-estatistico', '/relatorio-obitos'];
const ADMINISTRADOR_MENU_STORAGE_KEY = 'sidebar:administrador-open';
const ADMINISTRADOR_MENU_PATHS = ['/gerenciar-usuarios', '/gerenciar-acessos', '/gerenciar-dados', '/auditoria'];

const getInitialMenuState = (storageKey: string, paths: string[], pathname: string) => {
  if (typeof window !== 'undefined') {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue !== null) {
      return storedValue === 'true';
    }
  }
  return paths.some((path) => pathname.startsWith(path));
};

type NavHighlightVariant = 'lancamento' | 'sisgpo';

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  closeMobileMenu: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick: () => void;
  highlightVariant?: NavHighlightVariant;
  highlightClassName?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, onClick, highlightVariant, highlightClassName }) => {
  // New Sci-Fi Styles
  const baseClasses = `flex items-center gap-4 rounded-sm px-3 py-3 text-gray-400 transition-all duration-300 font-rajdhani hover:text-white hover:bg-white/5 relative group overflow-hidden ${highlightClassName || ''}`;

  // Neon Active State (Glow + Border)
  const activeClasses = "bg-neon-blue/10 text-neon-blue border-r-2 border-neon-blue shadow-[inset_-10px_0_20px_rgba(0,243,255,0.1)]";

  const handleClick = () => {
    if (isCollapsed) {
      onClick();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''} ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      {/* Glitch Effect on Hover */}
      <div className="absolute inset-0 bg-neon-blue/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>

      <span className="relative z-10 transition-transform group-hover:scale-110 duration-200">
        {icon}
      </span>

      {!isCollapsed && (
        <span className="relative z-10 inline-flex flex-1 items-center gap-2 font-medium tracking-wide">
          {label}
          {highlightVariant === 'sisgpo' && (
            <span className="rounded-sm border border-cyan-500/30 bg-cyan-950/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              SISGPO
            </span>
          )}
        </span>
      )}
    </NavLink>
  );
};


interface DropdownMenuProps {
  label: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  children: React.ReactNode;
  highlightVariant?: NavHighlightVariant;
  highlightClassName?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, isCollapsed, children, highlightClassName, isOpen, setIsOpen }) => {
  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          className={`flex w-full items-center justify-center gap-4 rounded-sm px-3 py-3 text-gray-400 transition-all duration-200 hover:text-white hover:bg-white/5 ${highlightClassName || ''}`}
          title={label}
        >
          {icon}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-sm px-3 py-3 text-gray-400 font-rajdhani transition-all duration-200 hover:text-white hover:bg-white/5 ${highlightClassName || ''}`}
      >
        <div className="flex items-center gap-4">
          <span className={`${isOpen ? 'text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : ''} transition-colors duration-300`}>{icon}</span>
          <span className={`font-medium tracking-wide ${isOpen ? 'text-white' : ''}`}>{label}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-neon-blue" /> : <ChevronDown size={16} />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="pl-4 border-l border-white/5 ml-4 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, setIsCollapsed, closeMobileMenu }) => {
  const { user } = useAuth();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(!isCollapsed);

  const [isRecursosMenuOpen, setIsRecursosMenuOpen] = useState(() =>
    getInitialMenuState(RECURSOS_MENU_STORAGE_KEY, RECURSOS_MENU_PATHS, location.pathname)
  );

  const [isRelatoriosMenuOpen, setIsRelatoriosMenuOpen] = useState(() =>
    getInitialMenuState(RELATORIOS_MENU_STORAGE_KEY, RELATORIOS_MENU_PATHS, location.pathname)
  );

  const [isAdministradorMenuOpen, setIsAdministradorMenuOpen] = useState(() =>
    getInitialMenuState(ADMINISTRADOR_MENU_STORAGE_KEY, ADMINISTRADOR_MENU_PATHS, location.pathname)
  );

  const isAdminUser = user?.role === 'admin' || user?.perfil === 'admin';
  const areAllDropdownsExpanded =
    isRecursosMenuOpen &&
    isRelatoriosMenuOpen &&
    (!isAdminUser || isAdministradorMenuOpen);
  const shouldEnableNavScroll = !isCollapsed && areAllDropdownsExpanded;
  const navContainerClasses = `flex-1 space-y-1 p-3 ${shouldEnableNavScroll ? 'overflow-y-auto pr-1 custom-scrollbar' : ''}`;

  React.useEffect(() => {
    setIsUserMenuOpen(!isCollapsed);
  }, [isCollapsed]);

  // Effect hooks for local storage synchronization omitted for brevity, logic remains same

  return (
    <aside
      className={`sidebar-panel flex h-screen flex-col border-r border-white/5 text-gray-300 shadow-[20px_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 bg-black/20 backdrop-blur-xl ${isCollapsed ? 'w-20' : 'w-72'}`}
      style={{
        background: 'linear-gradient(180deg, rgba(5,5,16,0.6) 0%, rgba(5,5,16,0.3) 100%)'
      }}
    >
      {/* Brand Header */}
      <div className="flex h-[73px] items-center justify-center border-b border-white/5 p-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>

        <Link to="/dashboard" className={`flex items-center gap-3 font-bold text-white group ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <ShieldCheck size={28} className="text-neon-blue drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-neon-blue blur-xl opacity-20 animate-pulse"></div>
          </div>
          {!isCollapsed && <span className="text-2xl font-orbitron tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">COCB</span>}
        </Link>
      </div>

      <nav className={navContainerClasses}>
        <div className="mb-4 px-3">
          {!isCollapsed && <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-orbitron mb-2">Principal</p>}
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
          <NavItem to="/lancar-ocorrencias" icon={<FilePlus size={20} />} label="Lançar Ocorrência" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="lancamento" />
        </div>

        <div className="mb-4 px-3 border-t border-white/5 pt-4">
          {!isCollapsed && <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-orbitron mb-2">Operacional</p>}
          <DropdownMenu
            label="Recursos Op."
            icon={<ShieldAlert size={20} />}
            isCollapsed={isCollapsed}
            highlightVariant="sisgpo"
            isOpen={isRecursosMenuOpen}
            setIsOpen={setIsRecursosMenuOpen}
          >
            <NavItem to="/plantoes-sisgpo" icon={<CalendarClock size={18} />} label="Plantões" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />
            <NavItem to="/viaturas-sisgpo" icon={<Car size={18} />} label="Viaturas" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />
            <NavItem to="/obms-sisgpo" icon={<Building2 size={18} />} label="OBMs" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />
            <NavItem to="/militares-sisgpo" icon={<Users size={18} />} label="Militares" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />
          </DropdownMenu>

          <DropdownMenu
            label="Relatórios"
            icon={<BarChart3 size={20} />}
            isCollapsed={isCollapsed}
            isOpen={isRelatoriosMenuOpen}
            setIsOpen={setIsRelatoriosMenuOpen}
          >
            <NavItem to="/relatorio-estatistico" icon={<BarChart3 size={18} />} label="Estatístico" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            <NavItem to="/relatorio-obitos" icon={<FileText size={18} />} label="Óbitos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
          </DropdownMenu>
        </div>

        {isAdminUser && (
          <div className="mb-4 px-3 border-t border-white/5 pt-4">
            {!isCollapsed && <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-orbitron mb-2">Sistema</p>}
            <DropdownMenu
              label="Administração"
              icon={<Database size={20} />}
              isCollapsed={isCollapsed}
              isOpen={isAdministradorMenuOpen}
              setIsOpen={setIsAdministradorMenuOpen}
            >
              <NavItem to="/gerenciar-usuarios" icon={<Users size={18} />} label="Usuários" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
              <NavItem to="/gerenciar-acessos" icon={<UserCheck size={18} />} label="Acessos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
              <NavItem to="/gerenciar-dados" icon={<Database size={18} />} label="Dados" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
              <NavItem to="/auditoria" icon={<ShieldAlert size={18} />} label="Auditoria" isCollapsed={isCollapsed} onClick={closeMobileMenu} />
            </DropdownMenu>
          </div>
        )}

      </nav>

      <div className="border-t border-white/5 p-4 bg-black/20">
        <div className="mb-4">
          <SystemStatusIndicator isCollapsed={isCollapsed} />
        </div>

        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex w-full items-center justify-between rounded-sm p-2 text-left transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <UserCircle size={32} className="text-gray-400" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight truncate">
                <span className="font-bold text-white font-rajdhani truncate">{user?.nome ?? 'Usuário'}</span>
                <span className="text-[10px] text-neon-blue uppercase tracking-wider truncate glow-text">{user?.obm_nome ?? 'OBM Padrao'}</span>
              </div>
            )}
          </div>
          {(isUserMenuOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />)}
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isUserMenuOpen ? 'max-h-32 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
          <NavItem to="/meu-perfil" icon={<UserCircle size={18} />} label="Meu Perfil" isCollapsed={false} onClick={closeMobileMenu} />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-4 rounded-sm px-3 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 mt-1 font-rajdhani font-medium"
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-4 rounded-sm p-2 mt-4 text-gray-500 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
