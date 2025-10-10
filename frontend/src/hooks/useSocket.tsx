﻿// Caminho: frontend/src/hooks/useSocket.ts

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
    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  }, []);

  useEffect(() => {
    if (!usuario) {
      if (socketRef.current) {
        socketRef.current.emit('user-logout');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
      return;
    }

    if (!socketRef.current) {
      console.log(`[Socket.IO] Tentando conectar a: ${socketUrl}`);
      const newSocket = io(socketUrl, { transports: ['polling', 'websocket'] });

      newSocket.on('connect', () => {
        console.log(`[Socket.IO] Conectado com sucesso. ID: ${newSocket.id}`);
        newSocket.emit('user-login', usuario);
      });

      newSocket.on('disconnect', (reason: string) => {
        console.warn(`[Socket.IO] Desconectado do servidor. Razao: ${reason}`);
        socketRef.current = null;
        setSocketInstance(null);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error(`[Socket.IO] Erro de conexao: ${err.message}`);
      });

      socketRef.current = newSocket;
      setSocketInstance(newSocket);
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
