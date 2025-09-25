// Caminho: api/src/services/socketService.ts

import { Server, Socket } from 'socket.io';

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  loginTime: string; // <-- 1. PROPRIEDADE ADICIONADA
}

// Mapeia userId para um Set de socketIds
const userSockets = new Map<number, Set<string>>( );
// Mapeia socketId para o objeto LoggedInUser
const socketToUser = new Map<string, LoggedInUser>();

const broadcastLoggedInUsers = (io: Server) => {
  const uniqueUsers = new Map<number, LoggedInUser>();
  for (const user of socketToUser.values()) {
    // Para garantir que sempre pegamos o primeiro horário de login, caso o usuário tenha múltiplas abas
    if (!uniqueUsers.has(user.id)) {
      uniqueUsers.set(user.id, user);
    }
  }
  const usersArray = Array.from(uniqueUsers.values());
  io.emit('update-logged-in-users', usersArray);
};

export const onSocketConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Novo cliente conectado: ${socket.id}`);

    // --- INÍCIO DA ALTERAÇÃO ---
    socket.on('user-login', (user: Omit<LoggedInUser, 'loginTime'>) => {
      // 2. CRIA O OBJETO COMPLETO COM O HORÁRIO DO LOGIN
      const userWithLoginTime: LoggedInUser = {
        ...user,
        loginTime: new Date().toISOString(),
      };

      if (!userSockets.has(userWithLoginTime.id)) {
        userSockets.set(userWithLoginTime.id, new Set<string>());
      }
      userSockets.get(userWithLoginTime.id)!.add(socket.id);
      socketToUser.set(socket.id, userWithLoginTime); // Armazena o usuário com o timestamp

      console.log(`[Socket.IO] Usuário logado: ${userWithLoginTime.nome} (ID: ${userWithLoginTime.id}) com socket: ${socket.id}`);
      broadcastLoggedInUsers(io);
    });
    // --- FIM DA ALTERAÇÃO ---

    socket.on('request-logged-in-users', () => {
      const uniqueUsers = new Map<number, LoggedInUser>();
      for (const user of socketToUser.values()) {
        if (!uniqueUsers.has(user.id)) {
          uniqueUsers.set(user.id, user);
        }
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
        const userSocketSet = userSockets.get(user.id);
        if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
                userSockets.delete(user.id);
            }
        }
        socketToUser.delete(socket.id);

        console.log(`[Socket.IO] Cliente desconectado: ${socket.id}. Usuário ID: ${user.id}.`);
        broadcastLoggedInUsers(io);
      } else {
        console.log(`[Socket.IO] Cliente desconectado (sem usuário associado): ${socket.id}`);
      }
    });
    
    socket.on('user-logout', () => {
      const user = socketToUser.get(socket.id);
      if (user) {
        const userSocketSet = userSockets.get(user.id);
        if (userSocketSet) {
            // Remove todos os sockets associados a este usuário
            userSocketSet.forEach(socketId => {
                socketToUser.delete(socketId);
                const socketInstance = io.sockets.sockets.get(socketId);
                if (socketInstance) {
                    socketInstance.disconnect(true);
                }
            });
            userSockets.delete(user.id);
        }
        console.log(`[Socket.IO] Logout explícito de: ID ${user.id}. Todas as sessões foram encerradas.`);
        broadcastLoggedInUsers(io);
      }
    });
  });
};
