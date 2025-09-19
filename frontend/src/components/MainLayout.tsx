import React, { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/useAuth';
import Sidebar from './Sidebar';

// --- Styled Components para o Layout ---

const PageWrapper = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #242424;
`;

interface ContentContainerProps {
  // CORREÇÃO: Usando transient prop
  $isSidebarCollapsed: boolean;
}

const ContentContainer = styled.div<ContentContainerProps>`
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  // CORREÇÃO: Usando transient prop
  margin-left: ${({ $isSidebarCollapsed }) => ($isSidebarCollapsed ? '80px' : '250px')};
  
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  height: 73px;
  box-sizing: border-box;
  border-bottom: 1px solid #444;
  flex-shrink: 0;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  color: #e0e0e0;
  margin: 0;
`;

const UserName = styled.span`
  color: #ccc;
`;

const PageBody = styled.main`
  padding: 2rem 2.5rem;
  flex-grow: 1;
  overflow-y: auto;
`;

// --- Componente Principal do Layout ---

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageTitle }) => {
  const { usuario, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <PageWrapper>
      <Sidebar 
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      {/* CORREÇÃO: Passando a prop como transient */}
      <ContentContainer $isSidebarCollapsed={isSidebarCollapsed}>
        <TopBar>
          <PageTitle>{pageTitle}</PageTitle>
          <UserName>Olá, {usuario?.nome}</UserName>
        </TopBar>
        <PageBody>
          {children}
        </PageBody>
      </ContentContainer>
    </PageWrapper>
  );
};

export default MainLayout;
