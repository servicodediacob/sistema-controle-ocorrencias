// Caminho: frontend/src/contexts/ChatProvider.tsx

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './useAuth';
import { useSocket } from '../hooks/useSocket';

// --- Interfaces ---
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

interface IChatContext {
  conversations: Conversations;
  openChats: number[];
  onlineUsers: LoggedInUser[];
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
  const { socket } = useSocket();
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

  const sendMessage = useCallback((recipientId: number, text: string) => {
    if (socket) {
      socket.emit('send-private-message', { recipientId, text });
    } else {
      console.error('[ChatProvider] Tentativa de enviar mensagem sem socket.');
    }
  }, [socket]);

  // Função para solicitar permissão de notificação
  const requestNotificationPermission = useCallback(() => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações de desktop.');
      return;
    }
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Permissão para notificações concedida.');
        } else {
          console.warn('Permissão para notificações negada.');
        }
      });
    }
  }, []);

  useEffect(() => {
    // Solicita permissão de notificação ao carregar o componente
    requestNotificationPermission();

    if (socket && usuario) {
      const handleUpdateUsers = (users: LoggedInUser[]) => {
        setOnlineUsers(users);
      };

      const handleNewMessage = (message: ChatMessage) => {
        const partnerId = message.senderId === usuario.id ? message.recipientId : message.senderId;

        setConversations(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), message],
        }));
        
        openChatWith(partnerId);

        if (message.recipientId === usuario.id && message.senderId !== usuario.id) {
          // Notificação sonora
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(e => console.warn("Não foi possível tocar o som de notificação:", e));

          // Notificação do sistema operacional
          if (Notification.permission === 'granted') {
            new Notification(`Nova mensagem de ${message.senderName}`, {
              body: message.text,
              icon: '/favicon.ico', // Ícone da notificação
            });
          }

          // Notificação na tela do sistema (já existente)
          addNotification(`Nova mensagem de ${message.senderName}`, 'info');
        }
      };

      socket.on('update-logged-in-users', handleUpdateUsers);
      socket.on('new-private-message', handleNewMessage);

      socket.emit('request-logged-in-users');

      return () => {
        socket.off('update-logged-in-users', handleUpdateUsers);
        socket.off('new-private-message', handleNewMessage);
      };
    }
  }, [socket, usuario, addNotification, openChatWith, requestNotificationPermission]);

  return (
    <ChatContext.Provider value={{ conversations, openChats, onlineUsers, openChatWith, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
