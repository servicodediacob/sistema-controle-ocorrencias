// Caminho: frontend/src/contexts/useAuth.ts

import { useContext } from 'react';
// CORREÇÃO: Importa o contexto e a interface diretamente do arquivo do provedor.
import { AuthContext, IAuthContext } from './AuthProvider';

export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);

  if (!context) {
    // Esta verificação continua sendo importante.
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
