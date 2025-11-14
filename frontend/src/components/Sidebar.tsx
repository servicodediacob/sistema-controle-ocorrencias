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
  const navLinkClasses = `flex items-center gap-4 rounded-md px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-gray-700 ${highlightTagClass} ${highlightClassName || ''}`;
  const activeClasses = "bg-blue-700 text-white";

  return (
    <NavLink
      to={to}
      onClick={onClick}
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
  highlightClassName?: string; // New prop for custom highlight class
}



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



const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, isCollapsed, children, highlightVariant, highlightClassName, isOpen, setIsOpen }) => {

  if (isCollapsed) {

    return (

      <div className="relative">

        <button

          className={`flex w-full items-center justify-center gap-4 rounded-md px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-gray-700 ${highlightClassName || ''}`}

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

        className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-gray-300 transition-all duration-200 hover:bg-gray-700 ${highlightClassName || ''}`}

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

  const [isRecursosMenuOpen, setIsRecursosMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(RECURSOS_MENU_STORAGE_KEY);
      if (storedValue !== null) {
        return storedValue === 'true';
      }
    }
    return RECURSOS_MENU_PATHS.some((path) => location.pathname.startsWith(path));
  });

  const [isRelatoriosMenuOpen, setIsRelatoriosMenuOpen] = useState(false);

  const [isAdministradorMenuOpen, setIsAdministradorMenuOpen] = useState(false);



  React.useEffect(() => {

    setIsUserMenuOpen(!isCollapsed);

  }, [isCollapsed]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(RECURSOS_MENU_STORAGE_KEY, String(isRecursosMenuOpen));
  }, [isRecursosMenuOpen]);



  return (

    <aside className={`flex h-screen flex-col bg-gray-800 text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      <div className="flex h-[73px] items-center justify-center border-b border-gray-700 p-2">

        <Link to="/dashboard" className={`flex items-center gap-3 font-bold text-white ${isCollapsed ? 'justify-center' : ''}`}>

          <ShieldCheck size={24} />

          {!isCollapsed && <span className="text-xl">COCB</span>}

        </Link>

      </div>



      <nav className="flex-1 space-y-2 p-2">

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



        {(user?.role === 'admin' || user?.perfil === 'admin') && (

          <>

            <div className="px-3 pt-4 pb-2">

              <span className={`text-xs font-semibold uppercase text-gray-400 ${isCollapsed ? 'hidden' : 'block'}`}>

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

            </DropdownMenu>

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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserCircle size={24} />
            {!isCollapsed && (
              <div className="flex flex-col leading-tight truncate">
                <span className="font-semibold truncate">{user?.nome ?? 'Usuário'}</span>
                <span className="text-xs text-gray-400 truncate">{user?.obm_nome ?? 'OBM não informada'}</span>
              </div>
            )}
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

