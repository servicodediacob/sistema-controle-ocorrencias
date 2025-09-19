import React from 'react';
import styled, { css } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

// ... (Ícones e ICONS permanecem os mesmos)
const Icon = ({ path, size = 24 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d={path}></path>
  </svg>
);

const ICONS = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  launch: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  manage: "M14.06 9.94L15.12 11l-4.18 4.17-1.42-1.42 4.52-4.52zM20.5 2c-3.04 0-5.5 2.46-5.5 5.5 0 1.02.28 1.97.75 2.8l-5.81 5.81-2.12-2.12-5.3 5.3L4.22 21l5.3-5.3 2.12 2.12 5.81-5.81c.83.47 1.78.75 2.8.75 3.04 0 5.5-2.46 5.5-5.5S23.54 2 20.5 2z",
  users: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  data: "M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm14 14H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  collapse: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  expand: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
};

interface SidebarContainerProps {
  isCollapsed: boolean;
}

const SidebarContainer = styled.aside<SidebarContainerProps>`
  width: 250px;
  background-color: #2c2c2c;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  box-sizing: border-box;
  transition: width 0.3s ease;
  z-index: 1000;
  border-right: 1px solid #444;
  padding: 0 1rem 1.5rem 1rem; /* Padding-top removido daqui */

  ${({ isCollapsed }) => isCollapsed && css`
    width: 80px;
    padding: 0 0.5rem 1.5rem 0.5rem;
    align-items: center;
  `}
`;

const SidebarTitle = styled.button<SidebarContainerProps>`
  color: #e9c46a;
  font-size: 1.5rem;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 73px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #444;

  ${({ isCollapsed }) => isCollapsed && css`
    opacity: 0;
    font-size: 0;
    border-bottom-color: transparent;
  `}
`;

// --- MUDANÇA 1: Novo container para os itens de navegação ---
const NavItemsContainer = styled.div`
  margin-top: 73px; /* Empurra o container para baixo do cabeçalho */
  padding-top: 1.5rem; /* Cria o espaçamento entre a linha e o primeiro botão */
`;

const NavButton = styled.button<{ isCollapsed: boolean; isActive: boolean }>`
  width: 100%;
  padding: 0.8rem 1rem;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 1rem;
  background-color: transparent;
  transition: background-color 0.2s ease;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;

  span {
    transition: opacity 0.2s ease;
    opacity: 1;
    white-space: nowrap;
  }

  ${({ isCollapsed }) => isCollapsed && css`
    justify-content: center;
    padding: 0.8rem;
    span {
      opacity: 0;
      width: 0;
    }
  `}

  ${({ isActive }) => isActive && css`
    background-color: #3a7ca5;
  `}

  &:hover {
    background-color: #4a4a4a;
  }
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

const CollapseButton = styled(NavButton)`
  margin-top: auto;
`;

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { path: '/relatorio', label: 'Relatório', icon: ICONS.report },
    { path: '/lancamento', label: 'Lançar Ocorrências', icon: ICONS.launch },
    { path: '/gestao-ocorrencias', label: 'Gerenciar Ocorrências', icon: ICONS.manage },
    { path: '/gestao-usuarios', label: 'Gerenciar Usuários', icon: ICONS.users },
    { path: '/gestao-dados', label: 'Gerenciar Dados', icon: ICONS.data },
  ];

  return (
    <SidebarContainer isCollapsed={isCollapsed}>
      <SidebarTitle 
        isCollapsed={isCollapsed} 
        onClick={() => navigate('/dashboard')}
        title="Ir para o Dashboard Principal"
      >
        COCB
      </SidebarTitle>
      
      {/* --- MUDANÇA 2: Envolver os botões com o novo container --- */}
      <NavItemsContainer>
        {navItems.map(item => (
          <NavButton
            key={item.path}
            onClick={() => navigate(item.path)}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.path}
            title={isCollapsed ? item.label : ''}
          >
            <Icon path={item.icon} />
            <span>{item.label}</span>
          </NavButton>
        ))}
      </NavItemsContainer>

      <Spacer />

      <CollapseButton 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        isCollapsed={isCollapsed}
        isActive={false}
        title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
      >
        <Icon path={isCollapsed ? ICONS.expand : ICONS.collapse} />
        <span>{isCollapsed ? '' : 'Recolher'}</span>
      </CollapseButton>

      <NavButton 
        onClick={onLogout} 
        isCollapsed={isCollapsed}
        isActive={false}
        title={isCollapsed ? 'Sair' : ''}
        style={{ backgroundColor: '#e76f51', marginTop: '0.5rem' }}
      >
        <Icon path={ICONS.logout} />
        <span>Sair</span>
      </NavButton>
    </SidebarContainer>
  );
};

export default Sidebar;
