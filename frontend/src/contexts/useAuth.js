// frontend/src/contexts/useAuth.js
import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Importa o contexto

// A única responsabilidade deste arquivo é exportar o hook.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
