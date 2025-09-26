// Caminho: api/src/middleware/roleMiddleware.ts

import { Response, NextFunction } from 'express';
// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Importamos a interface RequestWithUser diretamente do authMiddleware
import { RequestWithUser } from './authMiddleware';
// ======================= FIM DA CORREÇÃO =======================
import db from '../db';

// 2. Usamos a interface importada na assinatura da função
export const isAdmin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    // O 'req.usuario' agora é totalmente tipado e reconhecido pelo TypeScript
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
        res.status(401).json({ message: 'Não autorizado, usuário não identificado.' });
        return;
    }

    try {
        const { rows } = await db.query('SELECT role FROM usuarios WHERE id = $1', [usuarioId]);

        if (rows.length > 0 && rows[0].role === 'admin') {
            next(); // O usuário é admin, permite continuar
        } else {
            res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
        }
    } catch (error) {
        console.error("Erro na verificação de role 'admin':", error);
        res.status(500).json({ message: 'Erro interno ao verificar permissões de usuário.' });
    }
};
