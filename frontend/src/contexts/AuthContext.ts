// Caminho: frontend/src/contexts/AuthContext.ts

import { createContext } from 'react';
import { Socket } from 'socket.io-client'; // 1. Importe o tipo Socket

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
  socket: Socket | null; // 2. Adicione a propriedade socket
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

// Cria o contexto (sem alterações)
export const AuthContext = createContext<IAuthContext | null>(null);
