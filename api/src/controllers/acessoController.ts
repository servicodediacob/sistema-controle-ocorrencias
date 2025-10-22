// api/src/controllers/acessoController.ts

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { notifyAdmins } from '@/services/socketService';
import nodemailer from 'nodemailer';
import logger from '@/config/logger';
import { RequestWithUser } from '@/middleware/authMiddleware';

export const solicitarAcesso = async (req: Request, res: Response): Promise<void> => {
  const { nome, email, senha, obm_id } = req.body;

  if (!nome || !email || !senha || !obm_id) {
    res.status(400).json({ message: 'Todos os campos são obrigatórios: nome, email, senha e OBM.' });
    return;
  }

  try {
    // O Prisma pode verificar em múltiplas tabelas de forma mais complexa,
    // mas para este caso, duas consultas separadas são claras e eficientes.
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    const solicitacaoExistente = await prisma.solicitacaoAcesso.findUnique({ where: { email } });

    if (usuarioExistente || solicitacaoExistente) {
      res.status(409).json({ message: 'Este endereço de e-mail já está em uso ou aguardando aprovação.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const novaSolicitacao = await prisma.solicitacaoAcesso.create({
      data: {
        nome,
        email,
        senha_hash,
        obm_id: Number(obm_id),
        status: 'pendente',
      },
      select: { id: true, nome: true, email: true, data_solicitacao: true },
    });

    logger.info({ solicitacao: novaSolicitacao }, 'Nova solicitação de acesso recebida.');
    res.status(201).json({
      message: 'Solicitação de acesso enviada com sucesso! Aguarde a aprovação de um administrador.',
      solicitacao: novaSolicitacao,
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro ao criar solicitação de acesso.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const listarSolicitacoes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const solicitacoes = await prisma.solicitacaoAcesso.findMany({
      include: {
        obm: { select: { nome: true } }, // Inclui o nome da OBM
      },
      orderBy: {
        data_solicitacao: 'desc',
      },
    });

    // Formata a resposta para manter a compatibilidade com o frontend, se necessário
    const resultadoFormatado = solicitacoes.map(s => ({
      ...s,
      obm_nome: s.obm.nome,
    }));

    res.status(200).json(resultadoFormatado);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao listar solicitações de acesso.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Solicitação de acesso via Google (gera senha aleatória para cumprir o schema atual)
export const solicitarAcessoGoogle = async (req: Request, res: Response): Promise<void> => {
  const { nome, email, obm_id } = req.body as { nome?: string; email?: string; obm_id?: number };
  if (!nome || !email || !obm_id) {
    res.status(400).json({ message: 'Campos obrigatórios: nome, email, obm_id.' });
    return;
  }
  try {
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    const solicitacaoExistente = await prisma.solicitacaoAcesso.findUnique({ where: { email } });
    if (usuarioExistente || solicitacaoExistente) {
      res.status(409).json({ message: 'Já existe usuário ou solicitação pendente para este email.' });
      return;
    }
    const senhaRandom = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senhaRandom, salt);

    const novaSolicitacao = await prisma.solicitacaoAcesso.create({
      data: { nome, email, senha_hash, obm_id: Number(obm_id), status: 'pendente' },
      select: { id: true, nome: true, email: true, data_solicitacao: true },
    });

    try { notifyAdmins('acesso:solicitacao-nova', { id: novaSolicitacao.id, nome, email }); } catch {}

    res.status(201).json({ message: 'Solicitação enviada! Aguarde aprovação de um administrador.', solicitacao: novaSolicitacao });
  } catch (error) {
    logger.error({ err: error }, 'Erro ao criar solicitação de acesso (google).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const gerenciarSolicitacao = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { id } = req.params;
  const { acao } = req.body;
  const aprovador_id = req.usuario?.id;

  if (!acao || !['aprovar', 'recusar'].includes(acao)) {
    res.status(400).json({ message: "A ação é obrigatória e deve ser 'aprovar' ou 'recusar'." });
    return;
  }

  try {
    const solicitacao = await prisma.solicitacaoAcesso.findFirst({
      where: { id: Number(id), status: 'pendente' },
    });

    if (!solicitacao) {
      res.status(404).json({ message: 'Solicitação não encontrada ou já processada.' });
      return;
    }

    if (acao === 'aprovar') {
      // Usamos uma transação para garantir que ambas as operações (criar usuário e atualizar solicitação)
      // sejam concluídas com sucesso. Se uma falhar, a outra é revertida.
      await prisma.$transaction(async (tx) => {
        await tx.usuario.create({
          data: {
            nome: solicitacao.nome,
            email: solicitacao.email,
            senha_hash: solicitacao.senha_hash,
            role: 'user',
            obm_id: solicitacao.obm_id,
          },
        });

        await tx.solicitacaoAcesso.update({
          where: { id: solicitacao.id },
          data: {
            status: 'aprovado',
            aprovador_id,
            data_aprovacao: new Date(),
          },
        });
      });

      logger.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Usuário ${solicitacao.nome} aprovado e criado.`);
      res.status(200).json({ message: `Usuário ${solicitacao.nome} aprovado e criado com sucesso.` });

    } else { // acao === 'recusar'
      await prisma.solicitacaoAcesso.update({
        where: { id: solicitacao.id },
        data: {
          status: 'recusado',
          aprovador_id,
          data_aprovacao: new Date(),
        },
      });

      logger.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Solicitação de ${solicitacao.nome} recusada.`);
      res.status(200).json({ message: `Solicitação de ${solicitacao.nome} recusada.` });
    }

  } catch (error) {
    // O Prisma já faz o rollback da transação automaticamente em caso de erro.
    logger.error({ err: error, solicitacaoId: id }, 'Erro ao gerenciar solicitação.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// FORÇAR PUSH ENV.LOCAL