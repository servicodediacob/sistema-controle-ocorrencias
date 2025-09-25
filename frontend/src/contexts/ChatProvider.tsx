// Caminho: frontend/src/contexts/ChatProvider.tsx

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './useAuth';
import { useSocket } from '../hooks/useSocket'; // 1. Importa o hook useSocket

// --- Interfaces (sem alterações) ---
interface ChatMessage {
  senderId: number;
  senderName: string;
  recipientId: number;
  text: string;
  timestamp: string;
}

type Conversations = Record<number, ChatMessage[]>;

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: string;
}

// 2. A interface do contexto agora inclui a lista de usuários online
interface IChatContext {
  conversations: Conversations;
  openChats: number[];
  onlineUsers: LoggedInUser[]; // Lista de usuários online
  openChatWith: (userId: number) => void;
  closeChat: (userId: number) => void;
  sendMessage: (recipientId: number, text: string) => void;
}

const ChatContext = createContext<IChatContext | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat deve ser usado dentro de um ChatProvider');
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { socket } = useSocket(); // 3. Obtém a instância do socket do nosso hook centralizado
  const { addNotification } = useNotification();
  
  const [conversations, setConversations] = useState<Conversations>({});
  const [openChats, setOpenChats] = useState<number[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<LoggedInUser[]>([]);

  const openChatWith = useCallback((userId: number) => {
    if (!openChats.includes(userId)) {
      setOpenChats(prev => [...prev, userId]);
    }
  }, [openChats]);

  const closeChat = useCallback((userId: number) => {
    setOpenChats(prev => prev.filter(id => id !== userId));
  }, []);

  // 4. A função sendMessage agora usa o socket obtido do hook
  const sendMessage = useCallback((recipientId: number, text: string) => {
    if (socket) {
      socket.emit('send-private-message', { recipientId, text });
    } else {
      console.error("[ChatProvider] Tentativa de enviar mensagem sem uma conexão de socket ativa.");
    }
  }, [socket]);

  // 5. O useEffect agora configura todos os listeners do socket
  useEffect(() => {
    if (socket) {
      console.log("[ChatProvider] Socket ativo. Configurando listeners de chat...");

      // Listener para atualizar a lista de usuários online
      const handleUpdateUsers = (users: LoggedInUser[]) => {
        console.log("[ChatProvider] Recebido 'update-logged-in-users':", users);
        setOnlineUsers(users);
      };

      // Listener para novas mensagens privadas
      const handleNewMessage = (message: ChatMessage) => {
        console.log("[ChatProvider] Recebida 'new-private-message':", message);
        const partnerId = message.senderId === usuario?.id ? message.recipientId : message.senderId;

        setConversations(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), message],
        }));
        
        openChatWith(partnerId);

        // Mostra notificação apenas se a mensagem for para o usuário atual
        if (message.recipientId === usuario?.id && message.senderId !== usuario?.id) {
          addNotification(`Nova mensagem de ${message.senderName}`, 'info');
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(e => console.warn("Não foi possível tocar o som de notificação:", e));
        }
      };

      // Registra os listeners
      socket.on('update-logged-in-users', handleUpdateUsers);
      socket.on('new-private-message', handleNewMessage);

      // Solicita a lista inicial de usuários ao registrar os listeners
      socket.emit('request-logged-in-users');

      // Função de limpeza para remover os listeners quando o socket mudar ou o componente for desmontado
      return () => {
        console.log("[ChatProvider] Limpando listeners de chat.");
        socket.off('update-logged-in-users', handleUpdateUsers);
        socket.off('new-private-message', handleNewMessage);
      };
    }
  }, [socket, usuario, addNotification, openChatWith]); // Dependências do efeito

  return (
    <ChatContext.Provider value={{ conversations, openChats, onlineUsers, openChatWith, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
