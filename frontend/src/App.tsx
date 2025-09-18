// frontend/src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestaoOcorrenciasPage from './pages/GestaoOcorrenciasPage'; // Esta importação está sendo resolvida incorretamente
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage';

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
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        
        <Route 
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        <Route 
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route 
          path="/gestao-ocorrencias"
          element={
            <PrivateRoute>
              {/* O ERRO ACONTECE AQUI, POIS O TS ACHA QUE ESTE COMPONENTE PRECISA DE PROPS */}
              <GestaoOcorrenciasPage />
            </PrivateRoute>
          }
        />

        <Route 
          path="/gestao-usuarios"
          element={
            <PrivateRoute>
              <GestaoUsuariosPage />
            </PrivateRoute>
          }
        />

        <Route 
          path="/gestao-dados"
          element={
            <PrivateRoute>
              <GestaoDadosApoioPage />
            </PrivateRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
