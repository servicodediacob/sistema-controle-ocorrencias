// Caminho: frontend/src/hooks/useSocket.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

export const useSocket = () => {
  const { usuario, logout } = useAuth();
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    // CONECTA: Se o usuário está logado e o socket AINDA NÃO FOI CRIADO.
    if (usuario && !socketInstance) {
      console.log(`[useSocket] Usuário ${usuario.nome} logado. Criando e conectando socket...`);
      
      const newSocket = io(SOCKET_URL);

      newSocket.on('connect', () => {
        console.log('[Socket.IO] Conectado ao servidor com ID:', newSocket?.id);
        newSocket.emit('user-login', usuario);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] Desconectado do servidor. Razão: ${reason}`);
        setSocketInstance(null); // Limpa a instância ao desconectar
      });

      setSocketInstance(newSocket);
    }

    // DESCONECTA: Se o usuário NÃO está mais logado e o socket AINDA EXISTE.
    if (!usuario && socketInstance) {
      console.log('[useSocket] Usuário deslogado. Desconectando socket existente.');
      socketInstance.disconnect();
      setSocketInstance(null); // Limpa a instância para permitir uma nova conexão no próximo login
    }

    // A função de limpeza do useEffect não precisa fazer nada, pois o logout já trata a desconexão.
    return () => {};

  }, [usuario, socketInstance]); // Adicionado socketInstance como dependência para reavaliar quando ele muda

  const logoutWithSocket = () => {
    if (socketInstance) {
      console.log('[useSocket] Logout explícito. Emitindo user-logout.');
      socketInstance.emit('user-logout');
    }
    logout();
  };

  return { socket: socketInstance, logoutWithSocket };
};