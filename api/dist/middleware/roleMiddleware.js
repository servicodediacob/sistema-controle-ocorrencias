"use strict";
// api/src/middleware/roleMiddleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.roleMiddleware = void 0;
// Função que verifica se o usuário tem uma das roles permitidas
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        // Verifica se o usuário foi anexado à requisição e se sua role está na lista de permitidas
        if (req.usuario && roles.includes(req.usuario.role)) {
            next(); // Permite o acesso
        }
        else {
            // Se não tiver a permissão, retorna um erro de acesso proibido
            res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
// Sua função original (mantida para não quebrar outras partes do sistema)
const isAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.role === 'admin') {
        next(); // Permite o acesso
    }
    else {
        res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
};
exports.isAdmin = isAdmin;
