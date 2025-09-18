// frontend/src/contexts/useAuth.ts

import { useContext } from 'react';
import { AuthContext, IAuthContext } from './AuthContext'; // 1. Importa o contexto e a interface

// 2. O hook agora retorna o tipo IAuthContext, garantindo a tipagem
export const useAuth = (): IAuthContext => {
  // 3. O TypeScript infere que 'context' pode ser IAuthContext ou null
  const context = useContext(AuthContext);

  // 4. Verificação em tempo de execução para garantir que o hook é usado corretamente
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
