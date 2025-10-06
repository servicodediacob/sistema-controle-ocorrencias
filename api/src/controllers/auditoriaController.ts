// Caminho: api/src/controllers/auditoriaController.ts

import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import logger from '@/config/logger';

export const listarLogs = async (req: RequestWithUser, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const offset = (page - 1) * limit;

  try {
    const logsQuery = `
      SELECT id, usuario_nome, acao, detalhes, criado_em 
      FROM auditoria_logs
      ORDER BY criado_em DESC
      LIMIT $1 OFFSET $2;
    `;
    
    const totalQuery = 'SELECT COUNT(*) FROM auditoria_logs;';

    const [logsResult, totalResult] = await Promise.all([
      db.query(logsQuery, [limit, offset]),
      db.query(totalQuery)
    ]);

    const total = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      logs: logsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Erro ao listar logs de auditoria.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
