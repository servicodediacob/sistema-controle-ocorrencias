// api/src/controllers/relatorioController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { parseDateParam } from '@/utils/date';

export const getRelatorioCompleto = async (req: Request, res: Response): Promise<void> => {
  const { data_inicio, data_fim } = req.query;

  if (!data_inicio || !data_fim) {
    res.status(400).json({ message: 'As datas de inÇðcio e fim sÇœo obrigatÇürias.' });
    return;
  }

  try {
    const dataInicioDate = parseDateParam(data_inicio as string, 'data_inicio');
    const dataFimDate = parseDateParam(data_fim as string, 'data_fim');

    // 1. EstatÇðsticas (com fallback)
    let estatisticas: any[] = [];
    try {
      estatisticas = await prisma.estatisticaDiaria.findMany({
        where: {
          data_registro: { gte: dataInicioDate, lte: dataFimDate },
          deletado_em: null,
          natureza: { grupo: { not: 'RelatÇürio de Ç"bitos' } },
        },
        include: {
          natureza: true,
          obm: { include: { crbm: true } },
        },
      });
    } catch (err) {
      logger.error({ err }, 'Falha ao buscar estatisticas_diarias');
    }

    // 2. OcorrÇ¦ncias Detalhadas (destaques)
    let detalhadas: any[] = [];
    try {
      detalhadas = await prisma.ocorrenciaDetalhada.findMany({
        where: {
          data_ocorrencia: { gte: dataInicioDate, lte: dataFimDate },
          deletado_em: null,
          natureza: { grupo: { not: 'RelatÇürio de Ç"bitos' } },
        },
        include: {
          natureza: true,
          cidade: { include: { crbm: true } },
        },
      });
    } catch (err) {
      logger.error({ err }, 'Falha ao buscar ocorrencias_detalhadas');
    }

    // 3. Ç"bitos
    let obitos: any[] = [];
    try {
      obitos = await prisma.obitoRegistro.findMany({
        where: {
          data_ocorrencia: { gte: dataInicioDate, lte: dataFimDate },
          deletado_em: null,
        },
        include: {
          natureza: { select: { subgrupo: true } },
          obm: { select: { nome: true } },
        },
        orderBy: { data_ocorrencia: 'desc' },
      });
    } catch (err) {
      logger.error({ err }, 'Falha ao buscar obitos_registros');
    }

    // --- DEBUG: Verificando dados brutos de Çübitos ---
    console.log('--- Dados Brutos de Ç"bitos ---');
    console.dir(obitos, { depth: null });

    // Processamento em memÇüria
    const relatorioMap: Map<string, any> = new Map();
    let todasNaturezas: any[] = [];
    try {
      todasNaturezas = await prisma.naturezaOcorrencia.findMany({
        where: { grupo: { not: 'RelatÇürio de Ç"bitos' } },
      });
    } catch (err) {
      logger.error({ err }, 'Falha ao buscar naturezas_ocorrencia');
    }

    todasNaturezas.forEach(n => {
      const chave = `${n.grupo}|${n.subgrupo}`;
      relatorioMap.set(chave, {
        grupo: n.grupo,
        subgrupo: n.subgrupo,
        diurno: 0, noturno: 0, total_capital: 0, total_geral: 0,
        "1¶§ CRBM": 0, "2¶§ CRBM": 0, "3¶§ CRBM": 0, "4¶§ CRBM": 0, "5¶§ CRBM": 0,
        "6¶§ CRBM": 0, "7¶§ CRBM": 0, "8¶§ CRBM": 0, "9¶§ CRBM": 0,
      });
    });

    const processarItem = (item: any, quantidade: number) => {
      const nat = item?.natureza;
      const obm = item?.obm || item?.cidade;
      const crbmNome = obm?.crbm?.nome;

      if (!nat?.grupo || !nat?.subgrupo || !crbmNome) return;
      const chave = `${nat.grupo}|${nat.subgrupo}`;
      if (!relatorioMap.has(chave)) return;

      const entrada = relatorioMap.get(chave);
      entrada.total_geral += quantidade;

      if (crbmNome === '1¶§ CRBM') {
        entrada.total_capital += quantidade;
        if (obm?.nome?.includes('Diurno')) entrada.diurno += quantidade;
        if (obm?.nome?.includes('Noturno')) entrada.noturno += quantidade;
      }

      if (entrada[crbmNome] !== undefined) entrada[crbmNome] += quantidade;
    };

    // Somamos apenas os registros consolidados de estatÇðstica em lote.
    estatisticas.forEach(item => processarItem(item, item.quantidade));

    const estatisticasFinais = Array.from(relatorioMap.values()).sort((a, b) => {
      const ordemGrupo = ['Resgate', 'IncÇ¦ndio', 'Busca e Salvamento', 'AÇõÇæes Preventivas', 'Atividades TÇ¸cnicas', 'Produtos Perigosos', 'Defesa Civil'];
      const indexA = ordemGrupo.indexOf(a.grupo);
      const indexB = ordemGrupo.indexOf(b.grupo);
      if (indexA !== indexB) return indexA - indexB;
      return a.subgrupo.localeCompare(b.subgrupo);
    });

    const totalGeralEstatisticas = estatisticasFinais.reduce((acc, curr) => acc + curr.total_geral, 0);
    const totalObitos = obitos.reduce((acc, curr) => acc + (curr.quantidade_vitimas || 0), 0);

    // --- DEBUG: Verificando o total calculado ---
    console.log('--- Total de Ç"bitos Calculado ---');
    console.log(totalObitos);

    const usuarioNome = (req as any).user?.nome || 'UsuÇ­rio Desconhecido';

    const obitosResponse = obitos.map(o => ({
      ...o,
      natureza_nome: o.natureza?.subgrupo ?? '',
      obm_nome: o.obm?.nome ?? ''
    }));

    const destaquesResponse = detalhadas
      .filter(d => d?.natureza && d?.cidade)
      .map(d => ({
        ...d,
        natureza_descricao: d.natureza?.subgrupo ?? '',
        obm_nome: d.cidade?.nome ?? '',
        crbm_nome: d.cidade?.crbm?.nome ?? ''
      }));

    const responseData = {
      estatisticas: estatisticasFinais,
      totalGeralEstatisticas,
      obitos: obitosResponse,
      totalObitos,
      destaques: destaquesResponse,
      usuarioNome,
      dataInicio: dataInicioDate.toISOString().split('T')[0],
      dataFim: dataFimDate.toISOString().split('T')[0],
    };

    // --- DEBUG: Verificando o objeto de resposta final ---
    console.log('--- Objeto de Resposta Final ---');
    console.dir(responseData, { depth: null });

    res.status(200).json(responseData);

  } catch (error) {
    if ((error as any)?.name === 'BadRequestError') {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    // Em caso de erro inesperado, devolvemos objeto vazio para evitar quebra na UI.
    logger.error({ err: error, query: req.query }, 'Erro ao gerar relatÇürio completo.');
    res.status(200).json({
      estatisticas: [],
      totalGeralEstatisticas: 0,
      obitos: [],
      totalObitos: 0,
      destaques: [],
      usuarioNome: (req as any).user?.nome || 'UsuÇ­rio Desconhecido',
      dataInicio: data_inicio,
      dataFim: data_fim,
      fallback: true,
      message: 'Falha ao gerar relatÇürio completo.',
    });
  }
};

