// Caminho: frontend/src/contexts/AuthProvider.tsx

import { createContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '../services/api';

// --- INÍCIO DA ALTERAÇÃO ---
// 1. GARANTIR QUE A INTERFACE INCLUA OS CAMPOS DE PERMISSÃO
export interface IUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user'; // Tipo mais específico para a role
  obm_id: number | null;   // OBM pode ser nulo (para admins, por exemplo)
}
// --- FIM DA ALTERAÇÃO ---

export interface IAuthContext {
  isAuthenticated: boolean;
  usuario: IUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<IAuthContext | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as IUser;
        setUsuario(user);
        setToken(storedToken);
        console.log('[AuthProvider] Sessão restaurada do localStorage para:', user.nome);
      }
    } catch (error) {
      console.error("[AuthProvider] Falha ao carregar dados de autenticação do localStorage.", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    try {
      const data = await apiLogin(email, senha);
      if (data && data.usuario && data.token) {
        setUsuario(data.usuario);
        setToken(data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
        console.log('[AuthProvider] Login bem-sucedido para:', data.usuario.nome);
      } else {
        throw new Error('Resposta de login inválida do servidor.');
      }
    } catch (error) {
      console.error("[AuthProvider] Erro durante o login:", error);
      throw error;
    }
  };

  const logout = (): void => {
    console.log('[AuthProvider] Realizando logout.');
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  const value = { 
    usuario, 
    token, 
    login, 
    logout, 
    isAuthenticated: !!usuario,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a202c', color: 'white' }}>
        Verificando autenticação...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
