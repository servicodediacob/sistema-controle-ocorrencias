// frontend/src/components/ProtectedRoute.tsx

import React from 'react'; // A importação do React é necessária aqui.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

// O componente agora é definido como um Functional Component que aceita props.
// Embora não precisemos definir a interface explicitamente para 'children',
// vamos usar o <Outlet /> que é a forma mais idiomática no React Router v6.
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  // Enquanto o AuthProvider verifica o token, não renderize nada.
  if (loading) {
    return null; // Ou um spinner de tela cheia.
  }

  // Se não houver usuário e a verificação terminou, redirecione para o login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se houver um usuário, o <Outlet /> renderizará a rota filha correspondente
  // que está aninhada dentro da rota protegida no App.tsx.
  return <Outlet />;
};

export default ProtectedRoute;