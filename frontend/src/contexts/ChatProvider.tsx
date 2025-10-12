import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthProvider';
import { useSocket } from '../hooks/useSocket';

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
  loginTime: string;
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

export const useChat = (): IChatContext => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};

const dedupeUsers = (users: LoggedInUser[]): LoggedInUser[] => {
  const byId = new Map<number, LoggedInUser>();
  users.forEach((user) => {
    if (!byId.has(user.id)) {
      byId.set(user.id, user);
    }
  });
  return Array.from(byId.values());
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { socket } = useSocket();
  const { addNotification } = useNotification();

  const [conversations, setConversations] = useState<Conversations>({});
  const [openChats, setOpenChats] = useState<number[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<LoggedInUser[]>([]);

  const openChatWith = useCallback(
    (userId: number) => {
      setOpenChats((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    },
    [],
  );

  const closeChat = useCallback((userId: number) => {
    setOpenChats((prev) => prev.filter((id) => id !== userId));
  }, []);

  const sendMessage = useCallback(
    (recipientId: number, text: string) => {
      if (!socket) {
        console.error('[ChatProvider] Tentativa de enviar mensagem sem socket.');
        return;
      }
      socket.emit('send-private-message', { recipientId, text });
    },
    [socket],
  );

  useEffect(() => {
    if (!socket || !usuario) {
      return;
    }

    const handleUpdateUsers = (users: LoggedInUser[]) => {
      const sanitized = dedupeUsers(users);
      setOnlineUsers(sanitized);
    };

    const handleNewMessage = (message: ChatMessage) => {
      const partnerId = message.senderId === usuario.id ? message.recipientId : message.senderId;

      setConversations((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), message],
      }));

      openChatWith(partnerId);

      if (message.recipientId === usuario.id && message.senderId !== usuario.id) {
        addNotification(`Nova mensagem de ${message.senderName}`, 'info');
        void new Audio('/sounds/notification.mp3')
          .play()
          .catch((error) => console.warn('Não foi possível tocar o som de notificação:', error));
      }
    };

    socket.on('update-logged-in-users', handleUpdateUsers);
    socket.on('new-private-message', handleNewMessage);

    socket.emit('request-logged-in-users');

    return () => {
      socket.off('update-logged-in-users', handleUpdateUsers);
      socket.off('new-private-message', handleNewMessage);
    };
  }, [socket, usuario, addNotification, openChatWith]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        openChats,
        onlineUsers,
        openChatWith,
        closeChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
