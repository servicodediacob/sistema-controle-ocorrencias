// frontend/src/contexts/AuthContext.ts

import { createContext } from 'react';

// 1. Define a interface para o objeto de usuário
export interface IUser {
  id: number;
  nome: string;
  email: string;
}

// 2. Define a interface para o valor completo do contexto
export interface IAuthContext {
  isAuthenticated: boolean;
  usuario: IUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

// 3. Cria o contexto, tipando-o com a interface IAuthContext.
// O valor inicial é null, mas o TypeScript saberá que, quando usado,
// ele terá a forma de IAuthContext.
export const AuthContext = createContext<IAuthContext | null>(null);
