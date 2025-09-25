// Caminho: frontend/src/contexts/AuthContext.ts

import { createContext } from 'react';

// Interface para o objeto de usuário (sem alterações)
export interface IUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  obm_id: number | null;
}

// Interface para o valor completo do contexto
export interface IAuthContext {
  isAuthenticated: boolean;
  usuario: IUser | null;
  token: string | null;
  // A propriedade 'socket' foi removida daqui.
  // A lógica de socket agora é gerenciada pelo hook useSocket.
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

// Cria o contexto (sem alterações)
export const AuthContext = createContext<IAuthContext | null>(null);
