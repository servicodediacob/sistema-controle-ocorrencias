// frontend/src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { NotificationProvider } from './contexts/NotificationContext'; // Adicionado para consistência
import { DataProvider } from './contexts/DataProvider'; // << IMPORTANTE: Importando o DataProvider

// Proteção de rotas
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoAcessoPage from './pages/GestaoAcessoPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage';
import AuditoriaPage from './pages/AuditoriaPage';
import RelatorioPage from './pages/RelatorioPage';
import RelatorioObitosPage from './pages/RelatorioObitosPage';
import LancamentoPage from './pages/LancamentoPage';
import PerfilPage from './pages/PerfilPage';
import SolicitarAcessoPage from './pages/SolicitarAcessoPage';

const LoginRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <LoginPage />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

        {/*
          **CORREÇÃO ESTRUTURAL FINAL**
          O DataProvider envolve o ProtectedRoute. Isso garante que TODAS as rotas
          protegidas (que são as que precisam dos dados) recebam as informações
          de 'cidades' e 'naturezas' do hook useData().
        */}
        <Route element={
          <DataProvider>
            <ProtectedRoute />
          </DataProvider>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="relatorio-estatistico" element={<RelatorioPage />} />
          <Route path="relatorio-obitos" element={<RelatorioObitosPage />} />
          <Route path="lancar-ocorrencias" element={<LancamentoPage />} />
          <Route path="gerenciar-usuarios" element={<GestaoUsuariosPage />} />
          <Route path="gerenciar-acessos" element={<GestaoAcessoPage />} />
          <Route path="gerenciar-dados" element={<GestaoDadosApoioPage />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
          <Route path="meu-perfil" element={<PerfilPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    // A ordem dos provedores é importante.
    // Notificação > Autenticação > Conteúdo da Aplicação
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
