// api/src/controllers/obmController.ts

import { Response } from 'express';
import { RequestWithUser } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import logger from '../config/logger';

export const getObmsPendentesPorData = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { data } = req.query;

  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória.' });
    return;
  }

  try {
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
          equals: new Date(data + 'T00:00:00.000Z'), // Ensure comparison is for the start of the day in UTC
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
    logger.error({ err: error, data }, 'Erro ao buscar OBMs pendentes por data.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
