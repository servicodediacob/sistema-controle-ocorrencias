// backend/src/middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import db from '../db';

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
        res.status(401).json({ message: 'Não autorizado, usuário não identificado.' });
        return;
    }

    try {
        const { rows } = await db.query('SELECT role FROM usuarios WHERE id = $1', [usuarioId]);

        if (rows.length > 0 && rows[0].role === 'admin') {
            next(); // O usuário é um admin, pode prosseguir
        } else {
            res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
        }
    } catch (error) {
        console.error("Erro na verificação de role 'admin':", error);
        res.status(500).json({ message: 'Erro interno ao verificar permissões de usuário.' });
    }
};
