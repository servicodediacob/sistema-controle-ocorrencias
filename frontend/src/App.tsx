// frontend/src/App.tsx

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthProvider';
import { offlineSyncService } from './services/offlineSyncService';

// Lazy loading das páginas para Code Splitting e melhor performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const LancamentoPage = React.lazy(() => import('./pages/LancamentoPage'));
const RelatorioPage = React.lazy(() => import('./pages/RelatorioPage'));
const GestaoUsuariosPage = React.lazy(() => import('./pages/GestaoUsuariosPage'));
const GestaoAcessoPage = React.lazy(() => import('./pages/GestaoAcessoPage'));
const GestaoDadosApoioPage = React.lazy(() => import('./pages/GestaoDadosApoioPage'));
const PerfilPage = React.lazy(() => import('./pages/PerfilPage'));
const AuditoriaPage = React.lazy(() => import('./pages/AuditoriaPage'));
const OcorrenciaPage = React.lazy(() => import('./pages/OcorrenciaPage'));
const RelatorioObitosPage = React.lazy(() => import('./pages/RelatorioObitosPage'));
const PlantoesSisgpoPage = React.lazy(() => import('./pages/PlantoesSisgpoPage'));
const ViaturasSisgpoPage = React.lazy(() => import('./pages/ViaturasSisgpoPage'));
const ObmsSisgpoPage = React.lazy(() => import('./pages/ObmsSisgpoPage'));
const MilitaresSisgpoPage = React.lazy(() => import('./pages/MilitaresSisgpoPage'));
const SolicitarAcessoPage = React.lazy(() => import('./pages/SolicitarAcessoPage'));

import NavigationLogger from './components/NavigationLogger'; // Import the new component
import LoadingOverlay from './components/LoadingOverlay'; // Importar o LoadingOverlay
import PwaInstallPrompt from './components/PwaInstallPrompt';

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
      <Route path="/plantoes-sisgpo" element={<PrivateRoute><PlantoesSisgpoPage /></PrivateRoute>} />
      <Route path="/viaturas-sisgpo" element={<PrivateRoute><ViaturasSisgpoPage /></PrivateRoute>} />
      <Route path="/obms-sisgpo" element={<PrivateRoute><ObmsSisgpoPage /></PrivateRoute>} />
      <Route path="/militares-sisgpo" element={<PrivateRoute><MilitaresSisgpoPage /></PrivateRoute>} />
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
  // O AuthProvider já envolve o App em `main.tsx`,
  // então podemos usar o hook useAuth aqui para obter o estado de loading.
  const { loading } = useAuth();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* O LoadingOverlay agora reage ao estado de loading do AuthProvider */}
      <LoadingOverlay visible={loading} text="Carregando..." />
      <PwaInstallPrompt />
      <Suspense fallback={<LoadingOverlay visible={true} text="Carregando..." />}>
        <NavigationLogger />
        <AppContent />
      </Suspense>
    </Router>
  );
};

export default App;
