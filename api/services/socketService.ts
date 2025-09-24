// Caminho: api/src/services/socketService.ts

import { Server, Socket } from 'socket.io';

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
}

const onlineUsers = new Map<number, { user: LoggedInUser; socketId: string }>();

const broadcastLoggedInUsers = (io: Server) => {
  const usersArray = Array.from(onlineUsers.values()).map(item => item.user);
  io.emit('update-logged-in-users', usersArray);
};

export const onSocketConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Novo cliente conectado: ${socket.id}`);
    let currentUserId: number | null = null;

    socket.on('user-login', (user: LoggedInUser) => {
      currentUserId = user.id;
      onlineUsers.set(user.id, { user, socketId: socket.id });
      console.log(`[Socket.IO] Usuário logado: ${user.nome}. Total online: ${onlineUsers.size}`);
      broadcastLoggedInUsers(io);
    });

    // ======================= INÍCIO DA LÓGICA DE CHAT PRIVADO =======================
    
    // Removemos ou comentamos o chat geral
    /*
    socket.on('send-chat-message', (message: string) => { ... });
    */

    // Novo evento para mensagens privadas
    socket.on('send-private-message', ({ recipientId, text }: { recipientId: number; text: string }) => {
      // Garante que o remetente e o destinatário estão online
      if (currentUserId && onlineUsers.has(currentUserId) && onlineUsers.has(recipientId)) {
        const sender = onlineUsers.get(currentUserId)!.user;
        const recipientSocketId = onlineUsers.get(recipientId)!.socketId;

        const messagePayload = {
          senderId: sender.id,
          senderName: sender.nome,
          recipientId: recipientId,
          text: text,
          timestamp: new Date().toISOString(),
        };

        // Envia a mensagem para o destinatário específico
        io.to(recipientSocketId).emit('new-private-message', messagePayload);
        
        // Envia uma cópia para o remetente para atualizar sua própria UI
        socket.emit('new-private-message', messagePayload);

        console.log(`[Chat Privado] Mensagem de ${sender.nome} (ID: ${sender.id}) para ID: ${recipientId}`);
      }
    });

    // ======================= FIM DA LÓGICA DE CHAT PRIVADO =======================

    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        if (onlineUsers.get(currentUserId)?.socketId === socket.id) {
          onlineUsers.delete(currentUserId);
          console.log(`[Socket.IO] Usuário desconectado: ID ${currentUserId}. Total online: ${onlineUsers.size}`);
          broadcastLoggedInUsers(io);
        }
      }
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
    
    socket.on('user-logout', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.delete(currentUserId);
        console.log(`[Socket.IO] Logout explícito de: ID ${currentUserId}. Total online: ${onlineUsers.size}`);
        broadcastLoggedInUsers(io);
      }
    });
  });
};
