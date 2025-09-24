// Caminho: frontend/src/contexts/AuthProvider.tsx

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext, IUser } from './AuthContext';
import { login as apiLogin } from '../services/api';
import { io, Socket } from 'socket.io-client'; // 1. Importe o 'io' e 'Socket'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // 2. Estado para o socket
  const [loading, setLoading] = useState(true);

  // Função para conectar o socket
  const connectSocket = useCallback((user: IUser) => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log(`[Socket.IO] Conectado para o usuário: ${user.nome}`);
      newSocket.emit('user-login', user);
    });

    setSocket(newSocket);
  }, []);

  // Função para desconectar o socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('[Socket.IO] Desconectando...');
      socket.emit('user-logout');
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  // Efeito para carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as IUser;
        setUsuario(user);
        setToken(storedToken);
        connectSocket(user); // 3. Conecta o socket se encontrar um usuário no storage
      }
    } catch (error) {
      console.error("Falha ao carregar dados de autenticação", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, [connectSocket]);

  const login = async (email: string, senha: string): Promise<void> => {
    try {
      const data = await apiLogin(email, senha);
      if (data && data.usuario && data.token) {
        setUsuario(data.usuario);
        setToken(data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
        connectSocket(data.usuario); // 4. Conecta o socket após o login
      } else {
        throw new Error('Resposta de login inválida.');
      }
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
  };

  const logout = (): void => {
    disconnectSocket(); // 5. Desconecta o socket no logout
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  const value = { 
    usuario, 
    token, 
    socket, // 6. Fornece o socket no contexto
    login, 
    logout, 
    isAuthenticated: !!usuario 
  };

  if (loading) {
    return <div>Carregando autenticação...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
