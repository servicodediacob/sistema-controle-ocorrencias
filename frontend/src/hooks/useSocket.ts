// Caminho: frontend/src/hooks/useSocket.ts (versão final)

import { useEffect } from 'react'; // Removido useState
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
let socket: Socket | null = null;

export const useSocket = () => {
  const { usuario, logout } = useAuth();

  useEffect(() => {
    if (usuario && !socket) {
      socket = io(SOCKET_URL);

      socket.on('connect', () => {
        console.log('[Socket.IO] Conectado ao servidor com ID:', socket?.id);
        socket?.emit('user-login', usuario);
      });

      return () => {
        if (socket) {
          console.log('[Socket.IO] Desconectando...');
          socket.emit('user-logout');
          socket.disconnect();
          socket = null;
        }
      };
    }
  }, [usuario]);

  const logoutWithSocket = () => {
    if (socket) {
      socket.emit('user-logout');
    }
    logout();
  };

  return { socket, logoutWithSocket };
};
