import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
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
  status: 'enviado' | 'visualizado';
  seenAt: string | null;
}

type Conversations = Record<number, ChatMessage[]>;

type StoredChatMessage = Partial<ChatMessage> & {
  senderId: number;
  senderName: string;
  recipientId: number;
  text: string;
  timestamp: string;
};

type SocketMessagePayload = Omit<ChatMessage, 'status' | 'seenAt'> &
  Partial<Pick<ChatMessage, 'status' | 'seenAt'>>;

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
  unreadCounts: Record<number, number>;
  totalUnread: number;
  markConversationAsRead: (userId: number) => void;
  markMessagesAsSeen: (partnerId: number) => void;
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

const normalizeChatMessage = (message: StoredChatMessage): ChatMessage => ({
  senderId: message.senderId,
  senderName: message.senderName,
  recipientId: message.recipientId,
  text: message.text,
  timestamp: message.timestamp,
  status: message.status ?? 'enviado',
  seenAt: message.seenAt ?? null,
});

const normalizeConversations = (raw: unknown): Conversations => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized: Conversations = {};
  Object.entries(raw as Record<string, StoredChatMessage[]>).forEach(([key, messages]) => {
    const partnerId = Number(key);
    if (Number.isNaN(partnerId) || !Array.isArray(messages)) {
      return;
    }
    normalized[partnerId] = messages.map((message) => normalizeChatMessage(message));
  });

  return normalized;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { socket } = useSocket();
  const { addNotification } = useNotification();

  const [conversations, setConversations] = useState<Conversations>(() => {
    try {
      const savedConversations = sessionStorage.getItem('chatConversations');
      if (!savedConversations) {
        return {};
      }
      return normalizeConversations(JSON.parse(savedConversations));
    } catch (error) {
      console.error('Failed to parse conversations from sessionStorage', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('chatConversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to sessionStorage', error);
    }
  }, [conversations]);
  const [openChats, setOpenChats] = useState<number[]>(() => {
    try {
      const savedOpenChats = sessionStorage.getItem('openChats');
      return savedOpenChats ? JSON.parse(savedOpenChats) : [];
    } catch (error) {
      console.error('Failed to parse open chats from sessionStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('openChats', JSON.stringify(openChats));
    } catch (error) {
      console.error('Failed to save open chats to sessionStorage', error);
    }
  }, [openChats]);
  const [onlineUsers, setOnlineUsers] = useState<LoggedInUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>(() => {
    try {
      const stored = sessionStorage.getItem('chatUnreadCounts');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse unread counts from sessionStorage', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('chatUnreadCounts', JSON.stringify(unreadCounts));
    } catch (error) {
      console.error('Failed to save unread counts to sessionStorage', error);
    }
  }, [unreadCounts]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
    [unreadCounts],
  );

  const openChatWith = useCallback((userId: number) => {
    setOpenChats((prev) => {
      const withoutUser = prev.filter((id) => id !== userId);
      return [userId, ...withoutUser];
    });
  }, []);

  const closeChat = useCallback((userId: number) => {
    setOpenChats((prev) => prev.filter((id) => id !== userId));
  }, []);

  const markConversationAsRead = useCallback((userId: number) => {
    setUnreadCounts((prev) => {
      if (!prev[userId]) {
        return prev;
      }
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  const markMessagesAsSeen = useCallback(
    (partnerId: number) => {
      if (!usuario || !socket) return;

      let didUpdate = false;
      const seenAtTimestamp = new Date().toISOString();

      setConversations((prev) => {
        const conversation = prev[partnerId];
        if (!conversation) {
          return prev;
        }

        const updatedConversation = conversation.map((msg) => {
          if (msg.recipientId === usuario.id && msg.status === 'enviado') {
            didUpdate = true;
            return { ...msg, status: 'visualizado', seenAt: seenAtTimestamp };
          }
          return msg;
        });

        if (!didUpdate) {
          return prev;
        }

        return {
          ...prev,
          [partnerId]: updatedConversation,
        };
      });

      if (!didUpdate) {
        return;
      }

      socket.emit('mark-as-seen', { partnerId, readerId: usuario.id });
      markConversationAsRead(partnerId);
    },
    [socket, usuario, markConversationAsRead],
  );

  const sendMessage = useCallback(
    (recipientId: number, text: string) => {
      if (!socket) {
        console.error('[ChatProvider] Tentativa de enviar mensagem sem socket.');
        addNotification('Não foi possível enviar: sem conexão.', 'error');
        return;
      }
      socket.emit(
        'send-private-message',
        { recipientId, text },
        (result?: { ok: boolean; error?: string }) => {
          if (!result?.ok) {
            const msg =
              result?.error === 'not_authenticated'
                ? 'Sessão expirada. Faça login novamente.'
                : result?.error === 'invalid_payload'
                ? 'Mensagem inválida.'
                : result?.error === 'internal_error'
                ? 'Erro interno ao enviar a mensagem.'
                : 'Falha ao enviar a mensagem.';
            addNotification(msg, 'error');
          }
        },
      );
    },
    [socket, addNotification],
  );

  useEffect(() => {
    if (!socket || !usuario) {
      return;
    }

    const handleUpdateUsers = (users: LoggedInUser[]) => {
      const sanitized = dedupeUsers(users);
      setOnlineUsers(sanitized);
    };

    const handleNewMessage = (message: SocketMessagePayload) => {
      const partnerId = message.senderId === usuario.id ? message.recipientId : message.senderId;
      const normalizedMessage = normalizeChatMessage(message);

      setConversations((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), normalizedMessage],
      }));

      setOpenChats((prev) => {
        if (prev.length === 0) {
          return [partnerId];
        }
        if (prev[0] === partnerId) {
          return prev;
        }
        if (prev.includes(partnerId)) {
          const withoutPartner = prev.filter((id) => id !== partnerId);
          return [...withoutPartner, partnerId];
        }
        return [...prev, partnerId];
      });

      if (message.recipientId === usuario.id && message.senderId !== usuario.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
        addNotification(`Nova mensagem de ${message.senderName}`, 'info');
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          console.warn('Não foi possível tocar o som de notificação:', error);
        }
      }
    };

    socket.on('update-logged-in-users', handleUpdateUsers);
    // Notificações administrativas
    const handleNewAccess = (payload: any) => {
      if (usuario.role === 'admin') {
        addNotification(`Nova solicitação de acesso: ${payload?.nome || ''}`, 'info');
      }
    };
    const handleFirstGoogle = (payload: any) => {
      if (usuario.role === 'admin') {
        addNotification(`Primeiro login Google: ${payload?.email || ''}`, 'warning');
      }
    };

    const handleMessagesSeen = ({
      partnerId,
      readerId,
      seenAt,
    }: {
      partnerId: number;
      readerId: number;
      seenAt?: string;
    }) => {
      if (usuario?.id !== partnerId) {
        return;
      }

      const seenTimestamp = seenAt ?? new Date().toISOString();

      setConversations((prev) => {
        const conversation = prev[readerId];
        if (!conversation) {
          return prev;
        }

        let didUpdate = false;
        const updatedConversation = conversation.map((msg) => {
          if (msg.recipientId === readerId && msg.status === 'enviado') {
            didUpdate = true;
            return { ...msg, status: 'visualizado', seenAt: seenTimestamp };
          }
          return msg;
        });

        if (!didUpdate) {
          return prev;
        }

        return {
          ...prev,
          [readerId]: updatedConversation,
        };
      });
    };

    socket.on('acesso:solicitacao-nova', handleNewAccess);
    socket.on('acesso:google-primeiro-login', handleFirstGoogle);
    socket.on('new-private-message', handleNewMessage);
    socket.on('messages-seen', handleMessagesSeen);

    socket.emit('request-logged-in-users');

    return () => {
      socket.off('update-logged-in-users', handleUpdateUsers);
      socket.off('new-private-message', handleNewMessage);
      socket.off('acesso:solicitacao-nova', handleNewAccess);
      socket.off('acesso:google-primeiro-login', handleFirstGoogle);
      socket.off('messages-seen', handleMessagesSeen);
    };
  }, [socket, usuario, addNotification]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        openChats,
        onlineUsers,
        openChatWith,
        closeChat,
        sendMessage,
        unreadCounts,
        totalUnread,
        markConversationAsRead,
        markMessagesAsSeen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
