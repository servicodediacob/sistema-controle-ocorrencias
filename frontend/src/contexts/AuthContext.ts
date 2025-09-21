// frontend/src/contexts/AuthContext.ts

import { createContext } from 'react';

// 1. Define a interface para o objeto de usuário, AGORA COM 'role'
export interface IUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user'; // <-- CORREÇÃO: Adiciona a propriedade 'role'
  obm_id: number | null;   // <-- CORREÇÃO: Adiciona a OBM do usuário
}

// 2. Define a interface para o valor completo do contexto (sem alterações aqui)
export interface IAuthContext {
  isAuthenticated: boolean;
  usuario: IUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

// 3. Cria o contexto (sem alterações aqui)
export const AuthContext = createContext<IAuthContext | null>(null);
