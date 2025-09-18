// frontend/src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth.js';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestaoOcorrenciasPage from './pages/GestaoOcorrenciasPage';
import GestaoUsuariosPage from './pages/GestaoUsuariosPage';
import GestaoDadosApoioPage from './pages/GestaoDadosApoioPage'; // <-- 1. IMPORTAR A NOVA PÁGINA

/**
 * Componente de Rota Privada
 */
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
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

        {/* --- 2. ADICIONAR A NOVA ROTA PROTEGIDA PARA DADOS DE APOIO --- */}
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
