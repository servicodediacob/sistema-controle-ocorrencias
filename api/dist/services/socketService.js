"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = exports.notifyAdmins = exports.onSocketConnection = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const userSockets = new Map();
const socketToUser = new Map();
let currentIo = null;
const getUniqueLoggedInUsers = () => {
    const uniqueUsers = new Map();
    for (const user of socketToUser.values()) {
        if (!uniqueUsers.has(user.id)) {
            uniqueUsers.set(user.id, user);
        }
    }
    return Array.from(uniqueUsers.values());
};
const broadcastLoggedInUsers = (io) => {
    io.emit('update-logged-in-users', getUniqueLoggedInUsers());
};
const onSocketConnection = (io) => {
    currentIo = io;
    io.on('connection', (socket) => {
        logger_1.default.info(`[Socket.IO] Cliente conectado: ${socket.id}`);
        socket.on('user-login', (user, ack) => {
            const sanitizedUser = {
                ...user,
                loginTime: new Date().toISOString(),
            };
            if (!userSockets.has(sanitizedUser.id)) {
                userSockets.set(sanitizedUser.id, new Set());
            }
            userSockets.get(sanitizedUser.id).add(socket.id);
            socketToUser.set(socket.id, sanitizedUser);
            logger_1.default.info({ user: { id: sanitizedUser.id, nome: sanitizedUser.nome }, socketId: socket.id }, '[Socket.IO] Usuário logado e associado.');
            broadcastLoggedInUsers(io);
            if (typeof ack === 'function') {
                ack(getUniqueLoggedInUsers());
            }
        });
        socket.on('request-logged-in-users', () => {
            socket.emit('update-logged-in-users', getUniqueLoggedInUsers());
        });
        // Envio de mensagens privadas (somente remetente e destinatário recebem)
        socket.on('send-private-message', (payload, ack) => {
            try {
                const sender = socketToUser.get(socket.id);
                if (!sender) {
                    ack?.({ ok: false, error: 'not_authenticated' });
                    return;
                }
                const { recipientId, text } = payload || {};
                if (!recipientId || typeof text !== 'string' || text.trim().length === 0) {
                    ack?.({ ok: false, error: 'invalid_payload' });
                    return;
                }
                const timestamp = new Date().toISOString();
                const message = {
                    senderId: sender.id,
                    senderName: sender.nome,
                    recipientId,
                    text: text.trim(),
                    timestamp,
                    status: 'enviado',
                    seenAt: null,
                };
                // Entrega ao(s) socket(s) do destinatário, se online
                const recipientSockets = userSockets.get(recipientId);
                if (recipientSockets && recipientSockets.size > 0) {
                    recipientSockets.forEach((sid) => io.to(sid).emit('new-private-message', message));
                }
                // Ecoa ao(s) socket(s) do remetente para aparecer imediatamente na própria janela
                const senderSockets = userSockets.get(sender.id);
                if (senderSockets && senderSockets.size > 0) {
                    senderSockets.forEach((sid) => io.to(sid).emit('new-private-message', message));
                }
                else {
                    // fallback: usa o socket atual
                    socket.emit('new-private-message', message);
                }
                ack?.({ ok: true });
            }
            catch (err) {
                logger_1.default.error({ err }, '[Socket.IO] Erro em send-private-message');
                ack?.({ ok: false, error: 'internal_error' });
            }
        });
        socket.on('mark-as-seen', (payload, ack) => {
            try {
                const reader = socketToUser.get(socket.id);
                if (!reader) {
                    ack?.({ ok: false, error: 'not_authenticated' });
                    return;
                }
                const { partnerId, readerId } = payload || {};
                if (!partnerId || !readerId) {
                    ack?.({ ok: false, error: 'invalid_payload' });
                    return;
                }
                if (reader.id !== readerId) {
                    ack?.({ ok: false, error: 'forbidden' });
                    return;
                }
                const seenAt = new Date().toISOString();
                const responsePayload = { partnerId, readerId, seenAt };
                const partnerSockets = userSockets.get(partnerId);
                if (partnerSockets && partnerSockets.size > 0) {
                    partnerSockets.forEach((sid) => io.to(sid).emit('messages-seen', responsePayload));
                }
                const readerSockets = userSockets.get(readerId);
                if (readerSockets && readerSockets.size > 0) {
                    readerSockets.forEach((sid) => {
                        if (sid !== socket.id) {
                            io.to(sid).emit('messages-seen', responsePayload);
                        }
                    });
                }
                ack?.({ ok: true });
            }
            catch (err) {
                logger_1.default.error({ err }, '[Socket.IO] Erro em mark-as-seen');
                ack?.({ ok: false, error: 'internal_error' });
            }
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
            logger_1.default.info({ user: { id: user.id, nome: user.nome }, socketId: socket.id }, '[Socket.IO] Cliente desconectado.');
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
            logger_1.default.info({ userId: user.id }, '[Socket.IO] Logout explícito. Todas as sessões do usuário foram encerradas.');
            broadcastLoggedInUsers(io);
        });
    });
};
exports.onSocketConnection = onSocketConnection;
// Emite um evento para todos os administradores logados atualmente
const notifyAdmins = (event, payload) => {
    if (!currentIo)
        return;
    for (const [socketId, user] of socketToUser.entries()) {
        if (user.role === 'admin') {
            currentIo.to(socketId).emit(event, payload);
        }
    }
};
exports.notifyAdmins = notifyAdmins;
// Alias para compatibilidade com importação existente no server
exports.initializeSocket = exports.onSocketConnection;
