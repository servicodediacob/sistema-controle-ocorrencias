import { useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

export const useSocket = () => {
  const { usuario, logout } = useAuth();
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  // Memoiza a URL do socket para evitar recriações desnecessárias
  const socketUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    // CORREÇÃO: Remove o '/api' do final da URL para conectar na raiz do servidor
    return apiUrl.replace('/api', '' );
  }, []);

  useEffect(() => {
    if (usuario && !socketInstance) {
      console.log(`[Socket.IO] Tentando conectar a: ${socketUrl}`);
      const newSocket = io(socketUrl, {
        // Força o uso de polling primeiro, que é mais compatível com ambientes de nuvem
        transports: ['polling', 'websocket'],
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

    // Função de limpeza para desconectar o socket quando o componente desmontar
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [usuario, socketInstance, socketUrl]);

  const logoutWithSocket = () => {
    if (socketInstance) {
      socketInstance.emit('user-logout');
    }
    logout();
  };

  return { socket: socketInstance, logoutWithSocket };
};
