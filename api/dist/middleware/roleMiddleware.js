"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
// Middleware para verificar se o usuário tem a role 'admin'
const isAdmin = (req, res, next) => {
    // Verifica se o middleware 'proteger' já adicionou o usuário à requisição
    // e se a role desse usuário é 'admin'
    if (req.usuario && req.usuario.role === 'admin') {
        next(); // Permite o acesso
    }
    else {
        // Se não for admin, retorna um erro de acesso proibido
        res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
};
exports.isAdmin = isAdmin;
