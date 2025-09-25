// Caminho: frontend/src/hooks/useSocket.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

export const useSocket = () => {
  const { usuario, logout } = useAuth();
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (usuario && !socketInstance) {
      const newSocket = io(SOCKET_URL);

      newSocket.on('connect', () => {
        newSocket.emit('user-login', usuario);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] Desconectado do servidor. Razão: ${reason}`);
        setSocketInstance(null);
      });

      setSocketInstance(newSocket);
    }

    if (!usuario && socketInstance) {
      socketInstance.disconnect();
      setSocketInstance(null);
    }

    return () => {};

  }, [usuario, socketInstance]);

  const logoutWithSocket = () => {
    if (socketInstance) {
      socketInstance.emit('user-logout');
    }
    logout();
  };

  return { socket: socketInstance, logoutWithSocket };
};
