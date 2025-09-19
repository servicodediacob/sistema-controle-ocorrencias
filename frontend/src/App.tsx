import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestaoOcorrenciasPage from './pages/GestaoOcorrenciasPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage';
import LancamentoPage from './pages/LancamentoPage';
import RelatorioPage from './pages/RelatorioPage';

// Componente para proteger rotas que exigem autenticação
interface PrivateRouteProps {
  children: React.ReactElement;
}

function PrivateRoute({ children }: PrivateRouteProps): React.ReactElement {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Componente principal da aplicação
function App(): React.ReactElement {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas e de Redirecionamento */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        <Route 
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        {/* Rotas Privadas (Protegidas) */}
        <Route 
          path="/dashboard"
          element={<PrivateRoute><DashboardPage /></PrivateRoute>}
        />
        <Route 
          path="/lancamento"
          element={<PrivateRoute><LancamentoPage /></PrivateRoute>}
        />
        <Route 
          path="/relatorio"
          element={<PrivateRoute><RelatorioPage /></PrivateRoute>}
        />
        <Route 
          path="/gestao-ocorrencias"
          element={<PrivateRoute><GestaoOcorrenciasPage /></PrivateRoute>}
        />
        <Route 
          path="/gestao-usuarios"
          element={<PrivateRoute><GestaoUsuariosPage /></PrivateRoute>}
        />
        <Route 
          path="/gestao-dados"
          element={<PrivateRoute><GestaoDadosApoioPage /></PrivateRoute>}
        />
        
      </Routes>
    </Router>
  );
}

export default App;
