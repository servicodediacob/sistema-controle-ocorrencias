// Caminho: frontend/src/hooks/useSocket.ts

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

export const useSocket = () => {
  const { usuario } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const socketUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  }, []);

  useEffect(() => {
    if (!usuario) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
      return;
    }

    if (socketRef.current) {
      return;
    }

    console.log(`[Socket.IO] Tentando conectar a: ${socketUrl}`);
    const newSocket = io(socketUrl, { transports: ['polling', 'websocket'] });

    socketRef.current = newSocket;
    setSocketInstance(newSocket);

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

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
    };
  }, [usuario, socketUrl]);

  return { socket: socketInstance };
};
