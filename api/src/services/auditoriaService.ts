// Caminho: api/src/services/auditoriaService.ts

import db from '@/db';
import logger from '@/config/logger';
import { RequestWithUser } from '@/middleware/authMiddleware';

/**
 * Registra uma ação de auditoria no banco de dados.
 * @param req - O objeto de requisição, que deve conter as informações do usuário autenticado.
 * @param acao - Uma descrição clara da ação realizada (ex: 'CRIACAO_USUARIO').
 * @param detalhes - Um objeto com informações contextuais relevantes para a ação.
 */
export const registrarAcao = async (
  req: RequestWithUser,
  acao: string,
  detalhes: Record<string, any> = {}
): Promise<void> => {
  // Se não houver um usuário na requisição (ex: um script rodando sem autenticação), não faz nada.
  if (!req.usuario) {
    logger.warn({ acao, detalhes }, 'Tentativa de registrar ação de auditoria sem usuário autenticado.');
    return;
  }

  const { id: usuario_id, nome: usuario_nome } = req.usuario;

  try {
    const query = `
      INSERT INTO auditoria_logs (usuario_id, usuario_nome, acao, detalhes)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(query, [usuario_id, usuario_nome || 'Nome não disponível', acao, detalhes]);
    
    logger.info({ auditoria: { usuario_id, acao, detalhes } }, 'Ação de auditoria registrada com sucesso.');

  } catch (error) {
    // Loga o erro mas não interrompe a operação principal do usuário.
    // A falha em registrar um log não deve impedir a ação principal de ser concluída.
    logger.error({ 
        err: error, 
        auditoria: { usuario_id, acao, detalhes } 
    }, 'Falha ao registrar ação de auditoria.');
  }
};
