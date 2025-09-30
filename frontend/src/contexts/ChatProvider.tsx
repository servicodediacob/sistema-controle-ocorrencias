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

// --- INÃCIO DA ALTERAÃ‡ÃƒO ---
interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: string;
  loginTime: string; // <-- ADICIONE ESTA LINHA
}
// --- FIM DA ALTERAÃ‡ÃƒO ---

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
      console.log(`[ChatProvider] Enviando mensagem para ${recipientId}`);
      socket.emit('send-private-message', { recipientId, text });
    } else {
      console.error('[ChatProvider] Tentativa de enviar mensagem sem socket.');
    }
  }, [socket]);

  useEffect(() => {
    console.log('[ChatProvider Effect] Socket:', socket ? 'Ativo' : 'Inativo', '| UsuÃ¡rio:', usuario ? usuario.nome : 'Nenhum');

    if (socket && usuario) {
      console.log('[ChatProvider] Socket e usuÃ¡rio OK. Configurando listeners...');

      const handleUpdateUsers = (users: LoggedInUser[]) => {
        console.log('[ChatProvider] Evento \'update-logged-in-users\' recebido. UsuÃ¡rios:', users);
        setOnlineUsers(users);
      };

      const handleNewMessage = (message: ChatMessage) => {
        console.log('[ChatProvider] Evento \'new-private-message\' recebido:', message);
        const partnerId = message.senderId === usuario.id ? message.recipientId : message.senderId;

        setConversations(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), message],
        }));
        
        openChatWith(partnerId);

        if (message.recipientId === usuario.id && message.senderId !== usuario.id) {
          addNotification(`Nova mensagem de ${message.senderName}`, 'info');
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(e => console.warn('NÃ£o foi possÃ­vel tocar o som de notificaÃ§Ã£o:', e));
        }
      };

      socket.on('update-logged-in-users', handleUpdateUsers);
      socket.on('new-private-message', handleNewMessage);

      console.log('[ChatProvider] Emitindo \'request-logged-in-users\'...');
      socket.emit('request-logged-in-users');

      return () => {
        console.log('[ChatProvider] Limpando listeners de chat.');
        socket.off('update-logged-in-users', handleUpdateUsers);
        socket.off('new-private-message', handleNewMessage);
      };
    }
  }, [socket, usuario, addNotification, openChatWith]);

  console.log('[ChatProvider Render] UsuÃ¡rios Online Atuais:', onlineUsers);

  return (
    <ChatContext.Provider value={{ conversations, openChats, onlineUsers, openChatWith, closeChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
