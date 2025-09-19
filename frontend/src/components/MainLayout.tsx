import { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/useAuth';
import Sidebar from './Sidebar';
import { device, sidebar } from '../styles/theme';

// --- Styled Components ---

const PageWrapper = styled.div<{ $isCollapsed: boolean }>`
  display: grid;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  grid-template-columns: ${({ $isCollapsed }) => 
    $isCollapsed ? sidebar.widthCollapsed : sidebar.width} 1fr;
  transition: grid-template-columns 0.3s ease;

  @media ${device.tablet} {
    grid-template-columns: ${sidebar.widthCollapsed} 1fr;
  }
  
  @media ${device.mobileL} {
    grid-template-columns: 1fr;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.header`
  display: flex;
  justify-content: space-between; 
  align-items: center;
  padding: 1.25rem 2.5rem;
  height: 73px;
  box-sizing: border-box;
  border-bottom: 1px solid #444;
  flex-shrink: 0;

  @media ${device.tablet} {
    padding: 1.25rem 1.5rem;
  }
`;

const HamburgerButton = styled.button<{ $isMobileMenuOpen: boolean }>`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  margin-right: 1rem;
  z-index: 1100;
  transition: opacity 0.3s ease;

  @media ${device.mobileL} {
    display: block;
    opacity: ${({ $isMobileMenuOpen }) => ($isMobileMenuOpen ? '0' : '1')};
    pointer-events: ${({ $isMobileMenuOpen }) => ($isMobileMenuOpen ? 'none' : 'auto')};
  }
`;

const Backdrop = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;

  @media ${device.mobileL} {
    display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  color: #e0e0e0;
  margin: 0;

  @media ${device.tablet} {
    font-size: 1.5rem;
  }
`;

const PageBody = styled.main`
  flex-grow: 1;
  padding: 2rem 2.5rem;
  overflow-y: auto;

  @media ${device.tablet} {
    padding: 1.5rem;
  }
`;

// --- Componente Principal do Layout ---

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageTitle }) => {
  const { usuario, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <Backdrop $isOpen={isMobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      <PageWrapper $isCollapsed={isCollapsed}>
        <Sidebar 
          onLogout={logout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileMenuOpen}
          closeMobileMenu={() => setMobileMenuOpen(false)}
          userName={usuario?.nome}
        />
        
        <ContentContainer>
          <TopBar>
            <TitleContainer>
              <HamburgerButton 
                onClick={() => setMobileMenuOpen(true)}
                $isMobileMenuOpen={isMobileMenuOpen}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                </svg>
              </HamburgerButton>
              <PageTitle>{pageTitle}</PageTitle>
            </TitleContainer>
          </TopBar>
          <PageBody>
            {children}
          </PageBody>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};

export default MainLayout;
