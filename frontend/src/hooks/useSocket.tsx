// Caminho: frontend/src/hooks/useSocket.ts

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthProvider';

interface SocketContextValue {
  socket: Socket | null;
  logoutWithSocket: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario, logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const socketUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // Debug
    console.log('[Socket] VITE_API_BASE_URL:', apiUrl);

    // Se estiver usando Supabase diretamente, não tenta conectar Socket.IO
    if (apiUrl.includes('supabase.co')) {
      console.log('[Socket] Modo Supabase detectado. Socket.IO desabilitado.');
      return null;
    }

    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  }, []);

  useEffect(() => {
    // Se não há URL de socket (modo Supabase-only), não conecta
    if (!usuario || !socketUrl) {
      if (socketRef.current) {
        socketRef.current.emit('user-logout');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
      return;
    }

    if (!socketRef.current && socketUrl) {
      try {
        console.log(`[Socket.IO] Inicializando conexão... URL: ${socketUrl}`);
        const newSocket = io(socketUrl, {
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 3, // Limita tentativas
          timeout: 5000
        });

        newSocket.on('connect', () => {
          console.log(`[Socket.IO] Conectado com sucesso. ID: ${newSocket.id}`);
          if (usuario) {
            const payload = {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              role: (usuario.role ?? usuario.perfil ?? 'user') as 'admin' | 'user' | 'supervisor',
            };
            newSocket.emit('user-login', payload, () => {
              newSocket.emit('request-logged-in-users');
            });
          }
        });

        newSocket.on('disconnect', (reason: string) => {
          console.warn(`[Socket.IO] Desconectado. Razão: ${reason}`);
          if (reason === 'io server disconnect') {
            newSocket.connect();
          }
          // Se falhar por transporte/CORS, não limpa a ref imediatamente para evitar loop,
          // mas o socketInstance ficará null visualmente
        });

        newSocket.on('connect_error', (err: Error) => {
          console.warn(`[Socket.IO] Erro de conexão (provavelmente sem backend): ${err.message}`);
          // Se der erro, assumimos que não tem backend Socket.IO e paramos de tentar
          newSocket.disconnect();
          socketRef.current = null;
          setSocketInstance(null);
        });

        socketRef.current = newSocket;
        setSocketInstance(newSocket);
      } catch (e) {
        console.error('[Socket.IO] Falha crítica ao iniciar:', e);
      }
    }
  }, [usuario, socketUrl]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && usuario) {
      const payload = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: (usuario.role ?? usuario.perfil ?? 'user') as 'admin' | 'user' | 'supervisor',
      };
      socketRef.current.emit('user-login', payload, () => {
        socketRef.current?.emit('request-logged-in-users');
      });
    }
  }, [usuario]);

  const logoutWithSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('user-logout');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    }
    logout();
  }, [logout]);

  const value = useMemo<SocketContextValue>(() => ({
    socket: socketInstance,
    logoutWithSocket,
  }), [socketInstance, logoutWithSocket]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};
