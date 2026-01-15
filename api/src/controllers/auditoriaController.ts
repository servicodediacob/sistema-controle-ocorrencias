// Caminho: api/src/controllers/auditoriaController.ts

import { Request, Response } from 'express';
import { registrarAcao } from '../services/auditoriaService';
import { RequestWithUser } from '../middleware/authMiddleware';
import db from '@/db';
import logger from '@/config/logger';

export const registrarNavegacao = async (req: Request, res: Response) => {
  const { pathname, search } = req.body;
  
  // The user is available in req.usuario due to the `proteger` middleware
  await registrarAcao(req as RequestWithUser, 'NAVEGACAO', { pathname, search });

  res.sendStatus(204);
};

export const registrarMensagemChat = async (req: Request, res: Response) => {
  const { partnerId, message } = req.body;
  
  await registrarAcao(req as RequestWithUser, 'CHAT_MENSAGEM', { partnerId, message });

  res.sendStatus(204);
};

export const registrarFechamentoChat = async (req: Request, res: Response) => {
  const { partnerId } = req.body;
  
  await registrarAcao(req as RequestWithUser, 'CHAT_FECHAMENTO', { partnerId });

  res.sendStatus(204);
};

export const registrarAberturaChat = async (req: Request, res: Response) => {
  const { partnerId } = req.body;
  
  await registrarAcao(req as RequestWithUser, 'CHAT_ABERTURA', { partnerId });

  res.sendStatus(204);
};

export const registrarGeracaoRelatorio = async (req: Request, res: Response) => {
  const { tipo, filtros, assinatura } = req.body;
  
  await registrarAcao(req as RequestWithUser, 'GERACAO_RELATORIO', { tipo, filtros, assinatura });

  res.sendStatus(204);
};

export const listarLogs = async (req: RequestWithUser, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const offset = (page - 1) * limit;

  try {
    const logsQuery = `
      SELECT
        al.id,
        al.usuario_nome,
        o.nome as obm_nome,
        al.acao,
        al.detalhes,
        al.criado_em
      FROM
        auditoria_logs al
      LEFT JOIN
        usuarios u ON al.usuario_id = u.id
      LEFT JOIN
        obms o ON u.obm_id = o.id
      ORDER BY
        al.criado_em DESC
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
