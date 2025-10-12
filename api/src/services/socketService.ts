import { Server, Socket } from 'socket.io';
import logger from '@/config/logger';

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user' | 'supervisor';
  loginTime: string;
}

const userSockets = new Map<number, Set<string>>();
const socketToUser = new Map<string, LoggedInUser>();

const getUniqueLoggedInUsers = (): LoggedInUser[] => {
  const uniqueUsers = new Map<number, LoggedInUser>();

  for (const user of socketToUser.values()) {
    if (!uniqueUsers.has(user.id)) {
      uniqueUsers.set(user.id, user);
    }
  }

  return Array.from(uniqueUsers.values());
};

const broadcastLoggedInUsers = (io: Server) => {
  io.emit('update-logged-in-users', getUniqueLoggedInUsers());
};

export const onSocketConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Cliente conectado: ${socket.id}`);

    socket.on(
      'user-login',
      (user: Omit<LoggedInUser, 'loginTime'>, ack?: (users: LoggedInUser[]) => void) => {
        const sanitizedUser: LoggedInUser = {
          ...user,
          loginTime: new Date().toISOString(),
        };

        if (!userSockets.has(sanitizedUser.id)) {
          userSockets.set(sanitizedUser.id, new Set());
        }

        userSockets.get(sanitizedUser.id)!.add(socket.id);
        socketToUser.set(socket.id, sanitizedUser);

        logger.info(
          { user: { id: sanitizedUser.id, nome: sanitizedUser.nome }, socketId: socket.id },
          '[Socket.IO] Usuário logado e associado.',
        );

        broadcastLoggedInUsers(io);

        if (typeof ack === 'function') {
          ack(getUniqueLoggedInUsers());
        }
      },
    );

    socket.on('request-logged-in-users', () => {
      socket.emit('update-logged-in-users', getUniqueLoggedInUsers());
    });

    socket.on('disconnect', () => {
      const user = socketToUser.get(socket.id);
      if (!user) {
        return;
      }

      const socketIds = userSockets.get(user.id);
      if (socketIds) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          userSockets.delete(user.id);
        }
      }

      socketToUser.delete(socket.id);

      logger.info(
        { user: { id: user.id, nome: user.nome }, socketId: socket.id },
        '[Socket.IO] Cliente desconectado.',
      );

      broadcastLoggedInUsers(io);
    });

    socket.on('user-logout', () => {
      const user = socketToUser.get(socket.id);
      if (!user) {
        return;
      }

      const socketIds = userSockets.get(user.id);
      if (socketIds) {
        socketIds.forEach((socketId) => {
          socketToUser.delete(socketId);
          const socketInstance = io.sockets.sockets.get(socketId);
          if (socketInstance) {
            socketInstance.disconnect(true);
          }
        });

        userSockets.delete(user.id);
      }

      logger.info(
        { userId: user.id },
        '[Socket.IO] Logout explícito. Todas as sessões do usuário foram encerradas.',
      );

      broadcastLoggedInUsers(io);
    });
  });
};
