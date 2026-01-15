import React from 'react';
import styled, { css } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

// --- Ícones (SVG como componentes) ---
const Icon = ({ path, size = 20 }: { path: string; size?: number }) => (
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
};

// --- Styled Components ---

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #2c2c2c;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  color: #e0e0e0;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const UserName = styled.span`
  color: #ccc;
`;

const LogoutButton = styled.button`
  background-color: #e76f51;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #d66041;
  }
`;

const Divider = styled.hr`
  width: 100%;
  border: none;
  border-top: 1px solid #444;
  margin: 0;
`;

const NavBar = styled.nav`
  display: flex;
  padding: 0.5rem 2rem;
  gap: 0.5rem;
  background-color: #242424;
`;

const NavButton = styled.button<{ isActive: boolean }>`
  padding: 0.6rem 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  background-color: transparent;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ isActive }) => isActive && css`
    background-color: #3a7ca5;
  `}

  &:hover {
    background-color: #4a4a4a;
  }
`;

// --- Componente Principal do Header ---

interface HeaderProps {
  pageTitle: string;
  userName: string | undefined;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, userName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { path: '/relatorio', label: 'Relatório', icon: ICONS.report },
    { path: '/lancamento', label: 'Lançar', icon: ICONS.launch },
    { path: '/gestao-ocorrencias', label: 'Ocorrências', icon: ICONS.manage },
    { path: '/gestao-usuarios', label: 'Usuários', icon: ICONS.users },
    { path: '/gestao-dados', label: 'Dados', icon: ICONS.data },
  ];

  return (
    <HeaderContainer>
      <TopBar>
        <PageTitle>{pageTitle}</PageTitle>
        <UserInfo>
          <UserName>Olá, {userName || 'Usuário'}</UserName>
          <LogoutButton onClick={onLogout}>
            <Icon path={ICONS.logout} size={18} />
          </LogoutButton>
        </UserInfo>
      </TopBar>
      <Divider />
      <NavBar>
        {navItems.map(item => (
          <NavButton
            key={item.path}
            onClick={() => navigate(item.path)}
            isActive={location.pathname === item.path}
            title={item.label}
          >
            <Icon path={item.icon} />
            <span>{item.label}</span>
          </NavButton>
        ))}
      </NavBar>
    </HeaderContainer>
  );
};

export default Header;
