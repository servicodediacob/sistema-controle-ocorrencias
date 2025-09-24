// Caminho: frontend/src/contexts/ChatProvider.tsx

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

// Interface para a mensagem de chat
interface ChatMessage {
  senderId: number;
  senderName: string;
  recipientId: number;
  text: string;
  timestamp: string;
}

// O estado das conversas: um mapa do ID do parceiro para um array de mensagens
type Conversations = Record<number, ChatMessage[]>;

// Interface para o contexto do chat
interface IChatContext {
  conversations: Conversations;
  openChats: number[];
  openChatWith: (userId: number) => void;
  closeChat: (userId: number) => void;
  sendMessage: (recipientId: number, text: string) => void;
}

const ChatContext = createContext<IChatContext | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario, socket } = useAuth();
  const [conversations, setConversations] = useState<Conversations>({});
  const [openChats, setOpenChats] = useState<number[]>([]);

  const openChatWith = useCallback((userId: number) => {
    if (!openChats.includes(userId)) {
      setOpenChats(prev => [...prev, userId]);
    }
  }, [openChats]);

  const closeChat = useCallback((userId: number) => {
    setOpenChats(prev => prev.filter(id => id !== userId));
  }, []);

  const sendMessage = useCallback((recipientId: number, text: string) => {
    socket?.emit('send-private-message', { recipientId, text });
  }, [socket]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: ChatMessage) => {
        const partnerId = message.senderId === usuario?.id ? message.recipientId : message.senderId;

        setConversations(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), message],
        }));
        
        openChatWith(partnerId);
      };

      socket.on('new-private-message', handleNewMessage);
      return () => {
        socket.off('new-private-message');
      };
    }
  }, [socket, usuario, openChatWith]);

  return (
    <ChatContext.Provider value={{ conversations, openChats, openChatWith, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};