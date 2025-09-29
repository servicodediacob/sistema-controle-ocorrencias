import { Server, Socket } from 'socket.io';
import logger from '@/config/logger';

// Interface para o usuário logado, incluindo quando ele entrou
interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  loginTime: string;
}

// Mapeia userId para um Set de seus socketIds (permite múltiplas abas)
const userSockets = new Map<number, Set<string>>();
// Mapeia cada socketId para o objeto do usuário correspondente
const socketToUser = new Map<string, LoggedInUser>();

// Função para transmitir a lista atualizada de usuários online para todos
const broadcastLoggedInUsers = (io: Server) => {
  const uniqueUsers = new Map<number, LoggedInUser>();
  // Garante que cada usuário apareça apenas uma vez na lista
  for (const user of socketToUser.values()) {
    if (!uniqueUsers.has(user.id)) {
      uniqueUsers.set(user.id, user);
    }
  }
  const usersArray = Array.from(uniqueUsers.values());
  io.emit('update-logged-in-users', usersArray);
};

// Função principal que configura os listeners de eventos do Socket.IO
export const onSocketConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Cliente conectado: ${socket.id}`);

    // Evento disparado pelo frontend quando um usuário faz login
    socket.on('user-login', (user: Omit<LoggedInUser, 'loginTime'>) => {
      const userWithLoginTime: LoggedInUser = {
        ...user,
        loginTime: new Date().toISOString(),
      };

      if (!userSockets.has(userWithLoginTime.id)) {
        userSockets.set(userWithLoginTime.id, new Set<string>());
      }
      userSockets.get(userWithLoginTime.id)!.add(socket.id);
      socketToUser.set(socket.id, userWithLoginTime);

      logger.info({ user: { id: user.id, nome: user.nome }, socketId: socket.id }, `[Socket.IO] Usuário logado e associado.`);
      broadcastLoggedInUsers(io);
    });

    // Evento para um cliente pedir a lista de usuários atual
    socket.on('request-logged-in-users', () => {
      socket.emit('update-logged-in-users', Array.from(socketToUser.values()));
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      const user = socketToUser.get(socket.id);
      if (user) {
        const userSocketSet = userSockets.get(user.id);
        if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
                userSockets.delete(user.id);
            }
        }
        socketToUser.delete(socket.id);
        logger.info({ user: { id: user.id, nome: user.nome }, socketId: socket.id }, `[Socket.IO] Cliente desconectado.`);
        broadcastLoggedInUsers(io);
      }
    });
    
    // Evento de logout explícito
    socket.on('user-logout', () => {
        const user = socketToUser.get(socket.id);
        if (user) {
            const userSocketSet = userSockets.get(user.id);
            if (userSocketSet) {
                userSocketSet.forEach(socketId => {
                    socketToUser.delete(socketId);
                    const socketInstance = io.sockets.sockets.get(socketId);
                    if (socketInstance) {
                        socketInstance.disconnect(true);
                    }
                });
                userSockets.delete(user.id);
            }
            logger.info({ userId: user.id }, `[Socket.IO] Logout explícito. Todas as sessões do usuário foram encerradas.`);
            broadcastLoggedInUsers(io);
        }
    });
  });
};
