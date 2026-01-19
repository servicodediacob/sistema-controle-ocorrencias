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
  highlightClassName?: string; // New prop for custom highlight class
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, onClick, highlightVariant, highlightClassName }) => {
  const highlightTagClass =
    highlightVariant === 'lancamento'
      ? 'highlight-lancamento'
      : highlightVariant === 'sisgpo'
        ? 'highlight-sisgpo'
        : '';
  const navLinkClasses = `flex items-center gap-4 rounded-2xl px-3 py-2.5 text-text transition-all duration-200 hover:bg-white/10 ${highlightTagClass} ${highlightClassName || ''}`;
  const activeClasses = "bg-gradient-to-r from-[#3869D2] to-[#C57CF9] text-white shadow-[0_10px_30px_rgba(197,124,249,0.35)]";

  const handleClick = () => {
    // Only close the mobile menu if the sidebar is collapsed (i.e., on mobile)
    if (isCollapsed) {
      onClick();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) => `${navLinkClasses} ${isActive ? activeClasses : ''} ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      {!isCollapsed && (
        <span className="inline-flex flex-1 items-center gap-2 font-medium">
          {label}
          {highlightVariant === 'sisgpo' && (
            <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">
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

      <div className="relative">

        <button

          className={`flex w-full items-center justify-center gap-4 rounded-2xl px-3 py-2.5 text-text transition-all duration-200 hover:bg-white/10 ${highlightClassName || ''}`}

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

        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-text transition-all duration-200 hover:bg-white/10 ${highlightClassName || ''}`}

      >

        <div className="flex items-center gap-4">

          {icon}

          <span className="font-medium">{label}</span>

        </div>

        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}

      </button>

      {isOpen && <div className="mt-1 space-y-1 pl-6">{children}</div>}

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
  const navContainerClasses = `flex-1 space-y-2 p-2 ${shouldEnableNavScroll ? 'overflow-y-auto pr-2 sidebar-scroll' : ''}`;

  React.useEffect(() => {

    setIsUserMenuOpen(!isCollapsed);

  }, [isCollapsed]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(RECURSOS_MENU_STORAGE_KEY, String(isRecursosMenuOpen));
  }, [isRecursosMenuOpen]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(RELATORIOS_MENU_STORAGE_KEY, String(isRelatoriosMenuOpen));
  }, [isRelatoriosMenuOpen]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(ADMINISTRADOR_MENU_STORAGE_KEY, String(isAdministradorMenuOpen));
  }, [isAdministradorMenuOpen]);



  return (

    <aside className={`sidebar-panel flex h-screen flex-col border-r border-border text-text shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      <div className="flex h-[73px] items-center justify-center border-b border-border p-2">

        <Link to="/dashboard" className={`flex items-center gap-3 font-bold text-text-strong ${isCollapsed ? 'justify-center' : ''}`}>

          <ShieldCheck size={24} />

          {!isCollapsed && <span className="text-xl">COCB</span>}

        </Link>

      </div>



      <nav className={navContainerClasses}>

        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} onClick={closeMobileMenu} />







        <DropdownMenu



          label="Recursos Op."



          icon={<ShieldAlert size={20} />}



          isCollapsed={isCollapsed}



          highlightVariant="sisgpo"



          isOpen={isRecursosMenuOpen}



          setIsOpen={setIsRecursosMenuOpen}



        >



          <NavItem to="/plantoes-sisgpo" icon={<CalendarClock size={20} />} label="Plantoes SISGPO" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />



          <NavItem to="/viaturas-sisgpo" icon={<Car size={20} />} label="Viaturas SISGPO" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />



          <NavItem to="/obms-sisgpo" icon={<Building2 size={20} />} label="OBMs SISGPO" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />



          <NavItem to="/militares-sisgpo" icon={<Users size={20} />} label="Militares SISGPO" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="sisgpo" />



        </DropdownMenu>







        <DropdownMenu



          label="Relatorios"



          icon={<BarChart3 size={20} />}



          isCollapsed={isCollapsed}



          isOpen={isRelatoriosMenuOpen}



          setIsOpen={setIsRelatoriosMenuOpen}



        >



          <NavItem to="/relatorio-estatistico" icon={<BarChart3 size={20} />} label="Relatorio Estatistico" isCollapsed={isCollapsed} onClick={closeMobileMenu} />



          <NavItem to="/relatorio-obitos" icon={<FileText size={20} />} label="Relatorio de Obitos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />



        </DropdownMenu>





        <NavItem to="/lancar-ocorrencias" icon={<FilePlus size={20} />} label="Lancar Ocorrencias" isCollapsed={isCollapsed} onClick={closeMobileMenu} highlightVariant="lancamento" />



        {isAdminUser && (

          <>

            <div className="px-3 pt-4 pb-2">

              <span className={`text-xs font-semibold uppercase text-[rgba(216,219,255,0.65)] ${isCollapsed ? 'hidden' : 'block'}`}>

                Admin

              </span>

            </div>



            <DropdownMenu

              label="Administrador"

              icon={<ShieldAlert size={20} />}

              isCollapsed={isCollapsed}

              isOpen={isAdministradorMenuOpen}

              setIsOpen={setIsAdministradorMenuOpen}

            >

              <NavItem to="/gerenciar-usuarios" icon={<Users size={20} />} label="Gerenciar Usuários" isCollapsed={isCollapsed} onClick={closeMobileMenu} />

              <NavItem to="/gerenciar-acessos" icon={<UserCheck size={20} />} label="Gerenciar Acessos" isCollapsed={isCollapsed} onClick={closeMobileMenu} />

              <NavItem to="/gerenciar-dados" icon={<Database size={20} />} label="Gerenciar Dados" isCollapsed={isCollapsed} onClick={closeMobileMenu} />

              <NavItem to="/auditoria" icon={<ShieldAlert size={20} />} label="Logs de Auditoria" isCollapsed={isCollapsed} onClick={closeMobileMenu} />

            </DropdownMenu>

          </>

        )}



      </nav>


      <div className="border-t border-border p-2">
        <div className="mb-2">
          <SystemStatusIndicator isCollapsed={isCollapsed} />
        </div>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex w-full items-center justify-between rounded-2xl p-2 text-left hover:bg-white/10 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserCircle size={24} />
            {!isCollapsed && (
              <div className="flex flex-col leading-tight truncate">
                <span className="font-semibold truncate">{user?.nome ?? 'Usuário'}</span>
                <span className="text-xs text-[rgba(216,219,255,0.7)] truncate">{user?.obm_nome ?? 'OBM não informada'}</span>
              </div>
            )}
          </div>
          {(isUserMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
        </button>

        {isUserMenuOpen && (
          <div className="mt-2 space-y-2">
            <NavItem to="/meu-perfil" icon={<UserCircle size={20} />} label="Meu Perfil" isCollapsed={false} onClick={closeMobileMenu} />
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#ff5b80] to-[#f87171] px-3 py-2.5 text-left text-white transition-all duration-200 shadow-[0_10px_25px_rgba(248,113,113,0.35)]"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-4 rounded-2xl p-2 mt-2 text-[rgba(216,219,255,0.7)] hover:bg-white/10 hover:text-white"
        >
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

