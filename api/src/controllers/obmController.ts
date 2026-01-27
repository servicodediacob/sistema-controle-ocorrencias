// api/src/controllers/obmController.ts

import { Response } from 'express';
import { RequestWithUser } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import logger from '../config/logger';

export const getObmsPendentesPorIntervalo = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { dataInicio, dataFim } = req.query;

  if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
    res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    return;
  }

  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Encontrar todas as OBMs
    const todasObms = await prisma.oBM.findMany({
      select: {
        id: true,
        nome: true,
        crbm: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Encontrar as OBMs que já registraram estatísticas para a data fornecida
    const obmsComEstatisticas = await prisma.estatisticaDiaria.findMany({
      where: {
        data_registro: {
          gte: inicio,
          lte: fim,
        },
      },
      select: {
        obm_id: true,
      },
      distinct: ['obm_id'],
    });

    const obmIdsComEstatisticas = new Set(obmsComEstatisticas.map(e => e.obm_id));

    // Filtrar as OBMs que não registraram estatísticas
    const obmsPendentes = todasObms.filter(obm => !obmIdsComEstatisticas.has(obm.id));

    res.status(200).json(obmsPendentes.map(obm => ({
      id: obm.id,
      cidade_nome: obm.nome,
      crbm_nome: obm.crbm.nome,
    })));


  } catch (error) {
    logger.error({ err: error, dataInicio, dataFim }, 'Erro ao buscar OBMs pendentes por data.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const getObmsSisgpo = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const obms = await prisma.obmSisgpo.findMany({
      orderBy: { nome: 'asc' },
    });
    res.status(200).json({ data: obms });
  } catch (error) {
    logger.error(error, 'Erro ao buscar OBMs do SISGPO (Replicado).');
    res.status(500).json({ message: 'Erro ao buscar OBMs.' });
  }
};
