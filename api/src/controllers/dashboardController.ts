// api/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // ======================= INÍCIO DA CORREÇÃO =======================
    // Define o intervalo de busca para APENAS o dia de hoje, em UTC.
    const hojeInicio = new Date();
    hojeInicio.setUTCHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setUTCHours(23, 59, 59, 999);

    // Consulta 1: Total de ocorrências em lote (agora com filtro de data)
    const totalEstatisticas = await prisma.estatisticaDiaria.aggregate({
      _sum: { quantidade: true },
      where: {
        natureza: { grupo: { not: 'Relatório de Óbitos' } },
        data_registro: { // <-- FILTRO DE DATA ADICIONADO
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    // Consulta 2: Total de ocorrências detalhadas (agora com filtro de data)
    const totalDetalhadas = await prisma.ocorrenciaDetalhada.count({
      where: {
        natureza: { grupo: { not: 'Relatório de Óbitos' } },
        data_ocorrencia: { // <-- FILTRO DE DATA ADICIONADO
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    const totalLote = totalEstatisticas._sum?.quantidade || 0;
    const totalOcorrencias = totalLote + totalDetalhadas;
    // ======================= FIM DA CORREÇÃO =======================

    // Consulta 3: Total de óbitos DO DIA (alinha com a página de Lançamento de Óbitos)
    const totalObitos = await prisma.obitoRegistro.aggregate({
      _sum: { quantidade_vitimas: true },
      where: {
        data_ocorrencia: {
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    // As consultas de "Ocorrências por Natureza" e "Ocorrências por CRBM"
    // também devem ser gerais, sem filtro de data, para mostrar o histórico.
    // Portanto, o restante do código permanece como estava.
    const ocorrenciasPorNatureza = await prisma.estatisticaDiaria.groupBy({
      by: ['natureza_id'],
      _sum: { quantidade: true },
      where: { natureza: { grupo: { not: 'Relatório de Óbitos' } } },
      orderBy: { _sum: { quantidade: 'desc' } },
    });
    const naturezasInfo = await prisma.naturezaOcorrencia.findMany({
      where: { id: { in: ocorrenciasPorNatureza.map(n => n.natureza_id) } },
    });
    const naturezaMap = new Map(naturezasInfo.map(n => [n.id, n.subgrupo]));
    const statsPorNatureza = ocorrenciasPorNatureza.map(item => ({
      nome: naturezaMap.get(item.natureza_id) || 'Desconhecida',
      total: item._sum?.quantidade || 0,
    }));

    const ocorrenciasPorCrbm = await prisma.estatisticaDiaria.groupBy({
      by: ['obm_id'],
      _sum: { quantidade: true },
    });
    const obmsInfo = await prisma.oBM.findMany({
      where: { id: { in: ocorrenciasPorCrbm.map(o => o.obm_id) } },
      include: { crbm: true },
    });
    const crbmMap = new Map<number, { nome: string, total: number }>();
    ocorrenciasPorCrbm.forEach(item => {
      const obm = obmsInfo.find(o => o.id === item.obm_id);
      if (obm) {
        const crbm = crbmMap.get(obm.crbm_id) || { nome: obm.crbm.nome, total: 0 };
        crbm.total += item._sum?.quantidade || 0;
        crbmMap.set(obm.crbm_id, crbm);
      }
    });
    const statsPorCrbm = Array.from(crbmMap.values()).sort((a, b) => b.total - a.total);

    res.status(200).json({
      totalOcorrencias,
      totalObitos: totalObitos._sum?.quantidade_vitimas || 0,
      ocorrenciasPorNatureza: statsPorNatureza,
      ocorrenciasPorCrbm: statsPorCrbm,
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar estatísticas do dashboard.');
    res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
  }
};
