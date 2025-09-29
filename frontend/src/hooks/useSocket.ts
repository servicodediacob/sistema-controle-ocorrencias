// Caminho: frontend/src/hooks/useSocket.ts

import { useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

export const useSocket = () => {
  const { usuario } = useAuth();
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  // A URL do socket deve apontar para a raiz do servidor da API.
  const socketUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    // Remove '/api' do final, se existir, para conectar na raiz do servidor.
    return apiUrl.endsWith('/api' ) ? apiUrl.slice(0, -4) : apiUrl;
  }, []);

  useEffect(() => {
    if (usuario && !socketInstance) {
      console.log(`[Socket.IO] Tentando conectar a: ${socketUrl}`);
      const newSocket = io(socketUrl, {
        transports: ['polling', 'websocket'], // Prioriza polling para compatibilidade
      });

      newSocket.on('connect', () => {
        console.log(`[Socket.IO] Conectado com sucesso! ID: ${newSocket.id}`);
        newSocket.emit('user-login', usuario);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn(`[Socket.IO] Desconectado do servidor. Razão: ${reason}`);
        setSocketInstance(null);
      });

      newSocket.on('connect_error', (err) => {
        console.error(`[Socket.IO] Erro de conexão: ${err.message}`);
      });

      setSocketInstance(newSocket);
    }

    if (!usuario && socketInstance) {
      socketInstance.disconnect();
      setSocketInstance(null);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [usuario, socketInstance, socketUrl]);

  // A função de logout foi removida daqui para simplificar,
  // pois o logout principal já é tratado no AuthContext.

  return { socket: socketInstance };
};
