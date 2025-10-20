import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    // Define o intervalo (UTC) do dia atual
    const hojeInicio = new Date();
    hojeInicio.setUTCHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setUTCHours(23, 59, 59, 999);

    // Total de ocorrências do dia em lote (estatísticas diárias)
    const totalEstatisticas = await prisma.estatisticaDiaria.aggregate({
      _sum: { quantidade: true },
      where: {
        deletado_em: null,
        natureza: { grupo: { not: 'Relatório de Óbitos' } },
        data_registro: {
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    // O total de ocorrências agora vem apenas das estatísticas em lote.
    // A contagem de ocorrências detalhadas foi removida para evitar dupla contagem.
    const totalLote = totalEstatisticas._sum?.quantidade || 0;
    const totalOcorrencias = totalLote;

    // Total de óbitos (soma de vítimas)
    const totalObitos = await prisma.obitoRegistro.aggregate({
      _sum: { quantidade_vitimas: true },
      where: {
        deletado_em: null,
      },
    });

    // Ocorrências por natureza (histórico)
    const ocorrenciasPorNatureza = await prisma.estatisticaDiaria.groupBy({
      by: ['natureza_id'],
      _sum: { quantidade: true },
      where: { 
        deletado_em: null,
        natureza: { grupo: { not: 'Relatório de Óbitos' } } 
      },
      orderBy: { _sum: { quantidade: 'desc' } },
    });

    const naturezasInfo = await prisma.naturezaOcorrencia.findMany({
      where: { id: { in: ocorrenciasPorNatureza.map((n) => n.natureza_id) } },
    });
    const naturezaMap = new Map(naturezasInfo.map((n) => [n.id, n.subgrupo]));
    const statsPorNatureza = ocorrenciasPorNatureza.map((item) => ({
      nome: naturezaMap.get(item.natureza_id) || 'Desconhecida',
      total: item._sum?.quantidade || 0,
    }));

    // Ocorrências por CRBM (histórico)
    const ocorrenciasPorCrbm = await prisma.estatisticaDiaria.groupBy({
      by: ['obm_id'],
      _sum: { quantidade: true },
      where: {
        deletado_em: null,
      },
    });

    const obmsInfo = await prisma.oBM.findMany({
      where: { id: { in: ocorrenciasPorCrbm.map((o) => o.obm_id) } },
      include: { crbm: true },
    });

    const crbmMap = new Map<number, { nome: string; total: number }>();
    ocorrenciasPorCrbm.forEach((item) => {
      const obm = obmsInfo.find((o) => o.id === item.obm_id);
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

export const getOcorrenciasRecentes = async (_req: Request, res: Response) => {
  try {
    const ocorrencias = await prisma.ocorrenciaDetalhada.findMany({
      take: 5,
      orderBy: {
        data_ocorrencia: 'desc',
      },
      include: {
        natureza: true,
        cidade: true,
      },
    });
    res.json(ocorrencias);
  } catch (error) {
    logger.error('Erro ao buscar ocorrências recentes:', error);
    res.status(500).json({ message: 'Erro ao buscar ocorrências recentes.' });
  }
};

export const getOcorrenciasPorNatureza = async (_req: Request, res: Response) => {
  try {
    const agrupado = await prisma.estatisticaDiaria.groupBy({
      by: ['natureza_id'],
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    });

    const naturezasIds = agrupado.map((i) => i.natureza_id);
    const naturezas = await prisma.naturezaOcorrencia.findMany({
      where: { id: { in: naturezasIds } },
    });

    const naturezaMap = new Map(naturezas.map((n) => [n.id, n.subgrupo]));
    const resultado = agrupado.map((item) => ({
      nome: naturezaMap.get(item.natureza_id) || 'Desconhecida',
      quantidade: item._sum?.quantidade || 0,
    }));

    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao buscar ocorrências por natureza:', error);
    res.status(500).json({ message: 'Erro ao buscar ocorrências por natureza.' });
  }
};

export const getDashboardDataForSso = async (_req: Request, res: Response) => {
  try {
    const totalOcorrencias = await prisma.ocorrenciaDetalhada.count();
    const totalOcorrenciasHoje = await prisma.ocorrenciaDetalhada.count({
      where: {
        data_ocorrencia: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Mantém contagem de registros de óbitos para compatibilidade
    const totalObitos = await prisma.obitoRegistro.count();

    const dashboardData = {
      totalOcorrencias,
      totalOcorrenciasHoje,
      totalObitos,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard para SSO:', error);
    res.status(500).json({ message: 'Erro interno ao buscar dados do dashboard.' });
  }
};

