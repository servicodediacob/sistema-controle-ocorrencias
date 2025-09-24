// frontend/src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestaoOcorrenciasPage from './pages/GestaoOcorrenciasPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage';
import LancamentoPage from './pages/LancamentoPage';
import RelatorioPage from './pages/RelatorioPage';
import RelatorioObitosPage from './pages/RelatorioObitosPage';
import SolicitarAcessoPage from './pages/SolicitarAcessoPage';
import GestaoAcessoPage from './pages/GestaoAcessoPage';

interface PrivateRouteProps {
  children: React.ReactElement;
}

function PrivateRoute({ children }: PrivateRouteProps): React.ReactElement {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App(): React.ReactElement {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        <Route 
          path="/solicitar-acesso"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <SolicitarAcessoPage />}
        />
        
        {/* Rota Raiz */}
        <Route 
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        {/* Rotas Privadas */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/lancamento" element={<PrivateRoute><LancamentoPage /></PrivateRoute>} />
        <Route path="/relatorio" element={<PrivateRoute><RelatorioPage /></PrivateRoute>} />
        <Route path="/relatorio-obitos" element={<PrivateRoute><RelatorioObitosPage /></PrivateRoute>} />
        <Route path="/gestao-ocorrencias" element={<PrivateRoute><GestaoOcorrenciasPage /></PrivateRoute>} />
        <Route path="/gestao-usuarios" element={<PrivateRoute><GestaoUsuariosPage /></PrivateRoute>} />
        <Route path="/gestao-acesso" element={<PrivateRoute><GestaoAcessoPage /></PrivateRoute>} />
        <Route path="/gestao-dados" element={<PrivateRoute><GestaoDadosApoioPage /></PrivateRoute>} />
        
        {/* Rota de fallback para qualquer caminho não encontrado */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;

// Em qualquer lugar do App.tsx
// Forçando o deploy na Vercel
