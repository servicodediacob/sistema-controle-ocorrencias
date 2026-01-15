// api/src/middleware/roleMiddleware.ts

import { Response, NextFunction } from 'express';
import { RequestWithUser } from './authMiddleware';

// Função que verifica se o usuário tem uma das roles permitidas
export const roleMiddleware = (roles: string[]) => {
  const rolesNormalizadas = roles.map(role => role.toLowerCase());
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    const userRole = (req.usuario?.role ?? '').toLowerCase();

    // Verifica se o usuário foi anexado à requisição e se sua role está na lista de permitidas
    if (userRole && rolesNormalizadas.includes(userRole)) {
      next(); // Permite o acesso
      return;
    }

    // Se não tiver a permissão, retorna um erro de acesso proibido
    res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
  };
};

// Sua função original (mantida para não quebrar outras partes do sistema)
export const isAdmin = (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (req.usuario && req.usuario.role === 'admin') {
        next(); // Permite o acesso
    } else {
        res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
};
