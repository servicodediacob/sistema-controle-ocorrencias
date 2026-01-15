// api/src/controllers/unidadesController.ts

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma'; // Importa a instância singleton do Prisma Client
import logger from '@/config/logger';
import { OBM } from '@prisma/client'; // Importa o tipo OBM do Prisma Client
// Type guard simples para erros conhecidos do Prisma (baseado no campo 'code')
const isPrismaKnownError = (e: unknown): e is { code: string } => !!e && typeof (e as any).code === 'string';

/**
 * @description Busca todas as unidades (OBMs) e as informações do CRBM associado.
 */
export const getUnidades = async (_req: Request, res: Response): Promise<void> => {
  try {
    const unidades = await prisma.oBM.findMany({
      // O 'include' funciona como um JOIN, trazendo os dados do CRBM relacionado.
      include: {
        crbm: true, // Inclui o objeto CRBM completo
      },
    });

    //Ordenação em memória (PgBouncer não suporta orderBy aninhado)
    const unidadesOrdenadas = unidades.sort((a, b) => {
      const crbmCompare = a.crbm.nome.localeCompare(b.crbm.nome);
      if (crbmCompare !== 0) return crbmCompare;
      return a.nome.localeCompare(b.nome);
    });

    // Formata a resposta para corresponder à estrutura anterior, se necessário.
    const resultadoFormatado = unidadesOrdenadas.map(obm => ({
      id: obm.id,
      cidade_nome: obm.nome,
      crbm_nome: obm.crbm.nome,
      crbm_id: obm.crbm.id,
    }));

    res.status(200).json(resultadoFormatado);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar unidades (OBMs).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Cria uma nova unidade (OBM).
 */
export const criarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { nome, crbm_id } = req.body;

  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    const existingObm = await prisma.$queryRaw<OBM[]>`
      SELECT id, nome, crbm_id FROM "obms" WHERE nome = ${nome}
    `;

    if (existingObm.length > 0) {
      const obm = existingObm[0];
      const crbm = await prisma.cRBM.findUnique({ where: { id: obm.crbm_id } });
      res.status(409).json({
        message: `A OBM "${nome}" já existe e está associada ao CRBM "${crbm?.nome || 'desconhecido'}".`,
      });
      return;
    }

    const novaUnidade = await prisma.oBM.create({
      data: {
        nome: nome,
        crbm_id: crbm_id,
      },
    });
    logger.info({ unidade: novaUnidade }, 'Nova unidade (OBM) criada.');
    res.status(201).json(novaUnidade);
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao criar unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Atualiza uma unidade (OBM) existente.
 */
export const atualizarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, crbm_id } = req.body;

  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    const unidadeAtualizada = await prisma.oBM.update({
      where: { id: Number(id) }, // Prisma espera que o ID seja do tipo correto (neste caso, número)
      data: {
        nome: nome,
        crbm_id: crbm_id,
      },
    });
    logger.info({ unidade: unidadeAtualizada }, 'Unidade (OBM) atualizada.');
    res.status(200).json(unidadeAtualizada);
  } catch (error) {
    // P2025 é o código para "registro não encontrado" em uma operação de update ou delete.
    if (isPrismaKnownError(error) && error.code === 'P2025') {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Exclui uma unidade (OBM).
 */
export const excluirUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.oBM.delete({
      where: { id: Number(id) },
    });
    logger.info({ unidadeId: id }, 'Unidade (OBM) excluída.');
    res.status(204).send();
  } catch (error) {
    // P2003 é o código para violação de constraint de chave estrangeira (foreign key).
    if (isPrismaKnownError(error) && error.code === 'P2003') {
      res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a outros registros.' });
      return;
    }
    // P2025 indica que o registro a ser excluído não foi encontrado.
    if (isPrismaKnownError(error) && error.code === 'P2025') {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    logger.error({ err: error, unidadeId: id }, 'Erro ao excluir unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Busca todos os CRBMs.
 */
export const getCrbms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const crbms = await prisma.cRBM.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
    res.status(200).json(crbms);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar CRBMs.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
