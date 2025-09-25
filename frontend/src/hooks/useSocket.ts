// Caminho: frontend/src/hooks/useSocket.ts

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

// URL do servidor de socket, extraída da variável de ambiente
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

// Variável para manter a instância do socket fora do ciclo de vida do componente React
let socket: Socket | null = null;

/**
 * Hook personalizado para gerenciar a conexão global do Socket.IO.
 * Garante que exista apenas uma instância do socket enquanto o usuário está logado.
 */
export const useSocket = () => {
  const { usuario, logout } = useAuth();

  useEffect(() => {
    // 1. CONECTA: Se o usuário está logado e o socket ainda não existe
    if (usuario && !socket) {
      // Cria a instância do socket e conecta
      socket = io(SOCKET_URL);

      // Listener para o evento 'connect'
      socket.on('connect', () => {
        console.log('[Socket.IO] Conectado ao servidor com ID:', socket?.id);
        // Envia os dados do usuário para o servidor se registrar como online
        socket?.emit('user-login', usuario);
      });

      // Listener para o evento 'disconnect'
      socket.on('disconnect', () => {
        console.log('[Socket.IO] Desconectado do servidor.');
      });
    }

    // 2. DESCONECTA: Função de limpeza que é executada quando o hook é desmontado
    return () => {
      if (socket) {
        console.log('[Socket.IO] Limpando e desconectando o socket.');
        socket.emit('user-logout'); // Informa ao servidor que o usuário está saindo
        socket.disconnect();
        socket = null; // Limpa a instância
      }
    };
  }, [usuario]); // O efeito depende apenas do objeto 'usuario'

  /**
   * Função de logout que primeiro notifica o servidor via socket
   * antes de realizar o logout no cliente.
   */
  const logoutWithSocket = () => {
    if (socket) {
      socket.emit('user-logout');
    }
    // Chama a função de logout original do AuthContext
    logout();
  };

  // Retorna a instância do socket e a função de logout aprimorada
  return { socket, logoutWithSocket };
};
