// Caminho: api/src/services/auditoriaService.ts

import db from '@/db';
import logger from '@/config/logger';
import { RequestWithUser } from '@/middleware/authMiddleware';

import { prisma } from '../lib/prisma'; // Import prisma

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
  let usuario_id: number | null = null;
  let usuario_nome: string | null = 'N/A';

  if (req.usuario) {
    usuario_id = req.usuario.id;
    usuario_nome = req.usuario.nome;
  } else if (detalhes.email) {
    // If user is not in request (e.g. failed login), try to find user by email
    const usuario = await prisma.usuario.findUnique({ where: { email: detalhes.email } });
    if (usuario) {
      usuario_id = usuario.id;
      usuario_nome = usuario.nome;
    }
  }

  try {
    const query = `
      INSERT INTO auditoria_logs (usuario_id, usuario_nome, acao, detalhes)
      VALUES ($1, $2, $3, $4)
    `;
    // Garante JSON válido ao inserir na coluna jsonb
    const detalhesJson = JSON.stringify(detalhes ?? {});
    await db.query(query, [usuario_id, usuario_nome || 'Nome não disponível', acao, detalhesJson]);
    
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

