// Caminho: api/src/services/socketService.ts

import { Server, Socket } from 'socket.io';

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
}

// Mapeia userId para um Set de socketIds
const userSockets = new Map<number, Set<string>>( );
// Mapeia socketId para o objeto LoggedInUser
const socketToUser = new Map<string, LoggedInUser>();

const broadcastLoggedInUsers = (io: Server) => {
  const uniqueUsers = new Map<number, LoggedInUser>();
  for (const user of socketToUser.values()) {
    uniqueUsers.set(user.id, user);
  }
  const usersArray = Array.from(uniqueUsers.values());
  io.emit('update-logged-in-users', usersArray);
};

export const onSocketConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Novo cliente conectado: ${socket.id}`);

    socket.on('user-login', (user: LoggedInUser) => {
      if (!userSockets.has(user.id)) {
        userSockets.set(user.id, new Set<string>());
      }
      userSockets.get(user.id)!.add(socket.id);
      socketToUser.set(socket.id, user);

      console.log(`[Socket.IO] Usuário logado: ${user.nome} (ID: ${user.id}) com socket: ${socket.id}`);
      broadcastLoggedInUsers(io);
    });

    socket.on('request-logged-in-users', () => {
      const uniqueUsers = new Map<number, LoggedInUser>();
      for (const user of socketToUser.values()) {
        uniqueUsers.set(user.id, user);
      }
      const usersArray = Array.from(uniqueUsers.values());
      socket.emit('update-logged-in-users', usersArray);
    });

    socket.on('send-private-message', ({ recipientId, text }: { recipientId: number; text: string }) => {
      const sender = socketToUser.get(socket.id);
      if (!sender) {
        console.warn(`[Chat Privado] Remetente não encontrado para socket ID: ${socket.id}`);
        return;
      }

      const recipientSockets = userSockets.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        const messagePayload = {
          senderId: sender.id,
          senderName: sender.nome,
          recipientId: recipientId,
          text: text,
          timestamp: new Date().toISOString(),
        };

        recipientSockets.forEach(recSocketId => {
          io.to(recSocketId).emit('new-private-message', messagePayload);
        });
        
        userSockets.get(sender.id)?.forEach(senderSocketId => {
          io.to(senderSocketId).emit('new-private-message', messagePayload);
        });

        console.log(`[Chat Privado] Mensagem de ${sender.nome} (ID: ${sender.id}) para ID: ${recipientId}`);
      } else {
        console.log(`[Chat Privado] Destinatário ID ${recipientId} não encontrado online.`);
      }
    });

    socket.on('disconnect', () => {
      const user = socketToUser.get(socket.id);
      if (user) {
        userSockets.get(user.id)?.delete(socket.id);
        socketToUser.delete(socket.id);

        if (userSockets.get(user.id)?.size === 0) {
          userSockets.delete(user.id);
        }
        console.log(`[Socket.IO] Cliente desconectado: ${socket.id}. Usuário ID: ${user.id}.`);
        broadcastLoggedInUsers(io);
      }
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
    
    socket.on('user-logout', () => {
      const user = socketToUser.get(socket.id);
      if (user) {
        userSockets.get(user.id)?.delete(socket.id);
        socketToUser.delete(socket.id);

        if (userSockets.get(user.id)?.size === 0) {
          userSockets.delete(user.id);
        }
        console.log(`[Socket.IO] Logout explícito de: ID ${user.id} com socket: ${socket.id}`);
        broadcastLoggedInUsers(io);
      }
    });
  });
};
