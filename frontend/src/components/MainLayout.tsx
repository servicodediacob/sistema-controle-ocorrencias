import React, { useState, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { useAuth } from '../contexts/useAuth';
import Sidebar from './Sidebar';

// --- Styled Components para o Layout ---

const PageWrapper = styled.div`
  display: flex;
  background-color: #242424;
`;

interface ContentContainerProps {
  isSidebarCollapsed: boolean;
}

// --- MUDANÇA 2: O ContentContainer volta a ser o elemento principal ao lado da Sidebar ---
const ContentContainer = styled.div<ContentContainerProps>`
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  
  ${({ isSidebarCollapsed }) => css`
    margin-left: ${isSidebarCollapsed ? '80px' : '250px'};
  `}
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  height: 73px; /* Altura fixa para alinhar com a Sidebar */
  box-sizing: border-box;
  
  /* A divisória principal fica aqui */
  border-bottom: 1px solid #444; 
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
      {/* --- MUDANÇA 3: A Sidebar é o único componente de navegação fixo --- */}
      <Sidebar 
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <ContentContainer isSidebarCollapsed={isSidebarCollapsed}>
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
