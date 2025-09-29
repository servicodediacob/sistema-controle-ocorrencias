import { Response, NextFunction } from 'express';
import { RequestWithUser } from './authMiddleware';

// Middleware para verificar se o usuário tem a role 'admin'
export const isAdmin = (req: RequestWithUser, res: Response, next: NextFunction): void => {
    // Verifica se o middleware 'proteger' já adicionou o usuário à requisição
    // e se a role desse usuário é 'admin'
    if (req.usuario && req.usuario.role === 'admin') {
        next(); // Permite o acesso
    } else {
        // Se não for admin, retorna um erro de acesso proibido
        res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
};
