// frontend/src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { offlineSyncService } from './services/offlineSyncService';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LancamentoPage from './pages/LancamentoPage';
import RelatorioPage from './pages/RelatorioPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoAcessoPage from './pages/GestaoAcessoPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage';
import PerfilPage from './pages/PerfilPage';
import AuditoriaPage from './pages/AuditoriaPage';
import OcorrenciaPage from './pages/OcorrenciaPage';
import RelatorioObitosPage from './pages/RelatorioObitosPage';
import GestaoOcorrenciasPage from './pages/GestaoOcorrenciasPage';
import SolicitarAcessoPage from './pages/SolicitarAcessoPage';

const PrivateRoute: React.FC<{ children: React.ReactElement; roles?: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && roles.length > 0) {
    const allowed = roles.map(r => r.toLowerCase());
    const current = (user.role || '').toLowerCase();
    if (!allowed.includes(current)) {
      return <Navigate to="/" />;
    }
  }
  return children;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        console.log('Conexão restaurada. Tentando sincronizar dados pendentes...');
        offlineSyncService.syncPendingLancamentos(user.id);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      {/* Protegidas (cada página já inclui MainLayout internamente) */}
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/relatorio-estatistico" element={<PrivateRoute><RelatorioPage /></PrivateRoute>} />
      <Route path="/relatorio-obitos" element={<PrivateRoute><RelatorioObitosPage /></PrivateRoute>} />
      <Route path="/lancar-ocorrencias" element={<PrivateRoute><LancamentoPage /></PrivateRoute>} />
      <Route path="/ocorrencia/:id" element={<PrivateRoute><OcorrenciaPage /></PrivateRoute>} />
      <Route path="/gerenciar-usuarios" element={<PrivateRoute roles={['ADMIN']}><GestaoUsuariosPage /></PrivateRoute>} />
      <Route path="/gerenciar-acessos" element={<PrivateRoute roles={['ADMIN']}><GestaoAcessoPage /></PrivateRoute>} />
      <Route path="/gerenciar-dados" element={<PrivateRoute roles={['ADMIN']}><GestaoDadosApoioPage /></PrivateRoute>} />
      <Route path="/auditoria" element={<PrivateRoute roles={['ADMIN']}><AuditoriaPage /></PrivateRoute>} />
      <Route path="/meu-perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;