// frontend/src/contexts/AuthProvider.tsx

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { decodeJwt } from 'jose';
import { api, login as apiLogin, extractErrorMessage, IUser as ApiUser } from '../services/api';

import { offlineSyncService } from '../services/offlineSyncService';
import LoadingOverlay from '../components/LoadingOverlay';

// 1. Tipos compartilhados
// Unifica o tipo de usuário com o do serviço de API e permite um alias opcional `role`.
export type IUser = ApiUser & { role?: 'admin' | 'supervisor' | 'user' };

export interface IAuthContext {
  user: IUser | null;
  // Alias para compatibilidade com componentes antigos
  usuario: IUser | null;
  token: string | null;
  loading: boolean;
  login(credentials: { email: string; senha: string }): Promise<void>;
  loginWithJwt(token: string): void;
  logout(): void;
}

// 2. CRIAÇÃO DO CONTEXTO
export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

// 3. FUNÇÃO AUXILIAR (sem alterações)
const setUserFromToken = (token: string, setUser: (user: IUser) => void, setToken: (token: string) => void) => {
  const decoded = decodeJwt<IUser>(token);
  // Normaliza: se o token tiver apenas `perfil`, cria um alias `role` equivalente
  if (!decoded.role && decoded.perfil) {
    decoded.role = decoded.perfil as IUser['role'];
  }
  setUser(decoded);
  setToken(token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 4. COMPONENTE PROVIDER (sem alterações na lógica interna)
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('@siscob:token');
    if (storedToken) {
      try {
        setUserFromToken(storedToken, setUser, setToken);
      } catch (error) {
        console.error("Falha ao processar token salvo. Limpando.", error);
        localStorage.removeItem('@siscob:token');
      }
    }
    setLoading(false);
    setIsBootstrapping(false);
  }, []);

  const login = useCallback(async (credentials: { email: string; senha: string }) => {
    setLoading(true);
    try {
      const { token: newToken } = await apiLogin(credentials);
      if (!newToken) throw new Error('O servidor não retornou um token.');
      localStorage.setItem('@siscob:token', newToken);
      setUserFromToken(newToken, setUser, setToken);
    } catch (error) {
      console.error('Falha no processo de login:', error);
      throw new Error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    offlineSyncService.clearAllPendingLancamentos();
    localStorage.removeItem('@siscob:token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  }, []);

  const loginWithJwt = useCallback((newToken: string) => {
    localStorage.setItem('@siscob:token', newToken);
    setUserFromToken(newToken, setUser, setToken);
  }, []);

  return (
    <AuthContext.Provider value={{ user, usuario: user, token, loading, login, loginWithJwt, logout }}>
      {isBootstrapping ? <LoadingOverlay visible text="Preparando ambiente..." /> : children}
    </AuthContext.Provider>
  );
};

// 5. HOOK useAuth EXPORTADO DO MESMO ARQUIVO
export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
