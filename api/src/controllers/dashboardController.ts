import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { parseDateParam } from '../utils/date';

const RELATORIO_DE_OBITOS = 'Relatório de Óbitos';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const hojeInicio = new Date();
    hojeInicio.setUTCHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setUTCHours(23, 59, 59, 999);

    const filtroDiario = {
      deletado_em: null,
      data_registro: {
        gte: hojeInicio,
        lte: hojeFim,
      },
    };

    const filtroDiarioSemObitos = {
      ...filtroDiario,
      natureza: { grupo: { not: RELATORIO_DE_OBITOS } },
    };

    const totalEstatisticas = await prisma.estatisticaDiaria.aggregate({
      _sum: { quantidade: true },
      where: filtroDiarioSemObitos,
    });

    const totalOcorrencias = totalEstatisticas._sum?.quantidade ?? 0;

    const totalObitos = await prisma.obitoRegistro.aggregate({
      _sum: { quantidade_vitimas: true },
      where: {
        deletado_em: null,
        data_ocorrencia: {
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    const ocorrenciasPorNatureza = await prisma.estatisticaDiaria.groupBy({
      by: ['natureza_id'],
      _sum: { quantidade: true },
      where: filtroDiarioSemObitos,
      orderBy: { _sum: { quantidade: 'desc' } },
    });

    const naturezasInfo = await prisma.naturezaOcorrencia.findMany({
      where: { id: { in: ocorrenciasPorNatureza.map((n) => n.natureza_id) } },
    });
    const naturezaMap = new Map(naturezasInfo.map((n) => [n.id, n.subgrupo]));
    const statsPorNatureza = ocorrenciasPorNatureza.map((item) => ({
      nome: naturezaMap.get(item.natureza_id) ?? 'Desconhecida',
      total: item._sum?.quantidade ?? 0,
    }));

    const ocorrenciasPorCrbm = await prisma.estatisticaDiaria.groupBy({
      by: ['obm_id'],
      _sum: { quantidade: true },
      where: filtroDiarioSemObitos,
    });

    const obmsInfo = await prisma.oBM.findMany({
      where: { id: { in: ocorrenciasPorCrbm.map((o) => o.obm_id) } },
      include: { crbm: true },
    });

    const crbmMap = new Map<number, { nome: string; total: number }>();
    ocorrenciasPorCrbm.forEach((item) => {
      const obm = obmsInfo.find((o) => o.id === item.obm_id);
      if (!obm) {
        return;
      }
      const acumulado = crbmMap.get(obm.crbm_id) ?? { nome: obm.crbm.nome, total: 0 };
      acumulado.total += item._sum?.quantidade ?? 0;
      crbmMap.set(obm.crbm_id, acumulado);
    });

    res.status(200).json({
      totalOcorrencias,
      totalObitos: totalObitos._sum?.quantidade_vitimas ?? 0,
      ocorrenciasPorNatureza: statsPorNatureza,
      ocorrenciasPorCrbm: Array.from(crbmMap.values()).sort((a, b) => b.total - a.total),
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
    const hojeInicio = new Date();
    hojeInicio.setUTCHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setUTCHours(23, 59, 59, 999);

    const filtroDiarioSemObitos = {
      deletado_em: null,
      data_registro: {
        gte: hojeInicio,
        lte: hojeFim,
      },
      natureza: { grupo: { not: RELATORIO_DE_OBITOS } },
    };

    const agrupado = await prisma.estatisticaDiaria.groupBy({
      by: ['natureza_id'],
      _sum: { quantidade: true },
      where: filtroDiarioSemObitos,
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    });

    const naturezasIds = agrupado.map((item) => item.natureza_id);
    const naturezas = await prisma.naturezaOcorrencia.findMany({
      where: { id: { in: naturezasIds } },
    });

    const naturezaMap = new Map(naturezas.map((n) => [n.id, n.subgrupo]));
    const resultado = agrupado.map((item) => ({
      nome: naturezaMap.get(item.natureza_id) ?? 'Desconhecida',
      quantidade: item._sum?.quantidade ?? 0,
    }));

    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao buscar ocorrências por natureza:', error);
    res.status(500).json({ message: 'Erro ao buscar ocorrências por natureza.' });
  }
};

export const getDashboardDataForSso = async (req: Request, res: Response) => {
  const dataParam = req.query.data as string | undefined;
  const data = dataParam || new Date().toISOString().split('T')[0];

  try {
    const dataInicio = parseDateParam(data, 'data');
    dataInicio.setUTCHours(0, 0, 0, 0);

    const dataFim = new Date(dataInicio);
    dataFim.setUTCHours(23, 59, 59, 999);

    const dadosAgrupados = await prisma.estatisticaDiaria.groupBy({
      by: ['obm_id', 'natureza_id'],
      where: {
        data_registro: { gte: dataInicio, lte: dataFim },
        deletado_em: null,
      },
      _sum: {
        quantidade: true,
      },
    });

    const obmIds = dadosAgrupados.map((dado) => dado.obm_id);
    const naturezaIds = dadosAgrupados.map((dado) => dado.natureza_id);

    const [obms, naturezas] = await Promise.all([
      prisma.oBM.findMany({ where: { id: { in: obmIds } }, include: { crbm: true } }),
      prisma.naturezaOcorrencia.findMany({ where: { id: { in: naturezaIds } } }),
    ]);

    const obmMap = new Map(obms.map((obm) => [obm.id, obm]));
    const naturezaMap = new Map(naturezas.map((natureza) => [natureza.id, natureza]));

    const espelho = dadosAgrupados.map((dado) => {
      const obm = obmMap.get(dado.obm_id);
      const natureza = naturezaMap.get(dado.natureza_id);
      return {
        cidade_nome: obm?.nome || 'Desconhecida',
        crbm_nome: obm?.crbm?.nome || 'Desconhecido',
        natureza_nome: natureza?.subgrupo || 'Desconhecida',
        quantidade: dado._sum.quantidade || 0,
      };
    });

    const obitos = await prisma.obitoRegistro.findMany({
      where: {
        data_ocorrencia: { gte: dataInicio, lte: dataFim },
        deletado_em: null,
      },
      include: {
        obm: true,
        natureza: true,
      },
    });

    const ocorrenciasDestaque = await prisma.ocorrenciaDetalhada.findMany({
      where: {
        data_ocorrencia: { gte: dataInicio, lte: dataFim },
        deletado_em: null,
      },
      orderBy: { id: 'desc' },
      take: 1,
    });

    const espelhoBase = await prisma.oBM.findMany({
      include: { crbm: true },
      orderBy: [{ crbm: { nome: 'asc' } }, { nome: 'asc' }],
    });

    const totalOcorrenciasLote = await prisma.estatisticaDiaria.aggregate({
      _sum: { quantidade: true },
      where: {
        data_registro: { gte: dataInicio, lte: dataFim },
        deletado_em: null,
        natureza: { grupo: { not: RELATORIO_DE_OBITOS } },
      },
    });

    const totalObitosDia = obitos.reduce((sum, item) => sum + item.quantidade_vitimas, 0);

    const responsePayload = {
      data,
      stats: {
        totalOcorrencias: totalOcorrenciasLote._sum.quantidade || 0,
        totalObitos: totalObitosDia,
        ocorrenciasPorNatureza: [],
        ocorrenciasPorCrbm: [],
      },
      plantao: {
        ocorrenciasDestaque,
        supervisorPlantao: null,
      },
      relatorio: {
        estatisticas: [],
        obitos: obitos.map((obito) => ({
          id: obito.id,
          numero_ocorrencia: obito.numero_ocorrencia,
          quantidade_vitimas: obito.quantidade_vitimas,
          obm_nome: obito.obm.nome,
          natureza_nome: obito.natureza.subgrupo,
        })),
      },
      espelho,
      espelhoBase: espelhoBase.map((obm) => ({
        id: obm.id,
        cidade_nome: obm.nome,
        crbm_nome: obm.crbm.nome,
      })),
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao gerar payload do dashboard para SISGPO.');
    res.status(500).json({ message: 'Erro interno ao processar dados para o dashboard.' });
  }
};
