// api/src/controllers/relatorioController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { parseDateParam } from '@/utils/date';

export const getRelatorioCompleto = async (req: Request, res: Response): Promise<void> => {
  const { data_inicio, data_fim } = req.query;

  if (!data_inicio || !data_fim) {
    res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    return;
  }

  try {
    const dataInicioDate = parseDateParam(data_inicio as string, 'data_inicio');
    const dataFimDate = parseDateParam(data_fim as string, 'data_fim');

    // 1. Busca de Estatísticas
    const estatisticas = await prisma.estatisticaDiaria.findMany({
      where: {
        data_registro: { gte: dataInicioDate, lte: dataFimDate },
        deletado_em: null,
        natureza: { grupo: { not: 'Relatório de Óbitos' } },
      },
      include: {
        natureza: true,
        obm: { include: { crbm: true } },
      },
    });

    // 2. Busca de Ocorrências Detalhadas
    const detalhadas = await prisma.ocorrenciaDetalhada.findMany({
      where: {
        data_ocorrencia: { gte: dataInicioDate, lte: dataFimDate },
        deletado_em: null,
        natureza: { grupo: { not: 'Relatório de Óbitos' } },
      },
      include: {
        natureza: true,
        cidade: { include: { crbm: true } },
      },
    });

    // 3. Busca de Óbitos
    const obitos = await prisma.obitoRegistro.findMany({
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

    // --- DEBUG: Verificando dados brutos de óbitos ---
    console.log('--- Dados Brutos de Óbitos ---');
    console.dir(obitos, { depth: null });

    // Processamento e Agregação dos Dados (em memória)
    const relatorioMap: Map<string, any> = new Map();
    const todasNaturezas = await prisma.naturezaOcorrencia.findMany({
      where: { grupo: { not: 'Relatório de Óbitos' } },
    });

    todasNaturezas.forEach(n => {
      const chave = `${n.grupo}|${n.subgrupo}`;
      relatorioMap.set(chave, {
        grupo: n.grupo,
        subgrupo: n.subgrupo,
        diurno: 0, noturno: 0, total_capital: 0, total_geral: 0,
        "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0,
        "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0,
      });
    });

    const processarItem = (item: any, quantidade: number) => {
      const chave = `${item.natureza.grupo}|${item.natureza.subgrupo}`;
      const obm = item.obm || item.cidade;
      if (relatorioMap.has(chave) && obm) {
        const entrada = relatorioMap.get(chave);
        entrada.total_geral += quantidade;
        if (obm.crbm.nome === '1º CRBM') {
          entrada.total_capital += quantidade;
          if (obm.nome.includes('Diurno')) entrada.diurno += quantidade;
          if (obm.nome.includes('Noturno')) entrada.noturno += quantidade;
        }
        entrada[obm.crbm.nome] += quantidade;
      }
    };

    // Somamos apenas os registros consolidados de estatística em lote.
    // As ocorrências detalhadas são exibidas em "destaques", mas não devem alterar os totais.
    estatisticas.forEach(item => processarItem(item, item.quantidade));

    const estatisticasFinais = Array.from(relatorioMap.values()).sort((a, b) => {
      const ordemGrupo = ['Resgate', 'Incêndio', 'Busca e Salvamento', 'Ações Preventivas', 'Atividades Técnicas', 'Produtos Perigosos', 'Defesa Civil'];
      const indexA = ordemGrupo.indexOf(a.grupo);
      const indexB = ordemGrupo.indexOf(b.grupo);
      if (indexA !== indexB) return indexA - indexB;
      return a.subgrupo.localeCompare(b.subgrupo);
    });

    const totalGeralEstatisticas = estatisticasFinais.reduce((acc, curr) => acc + curr.total_geral, 0);
    const totalObitos = obitos.reduce((acc, curr) => acc + (curr.quantidade_vitimas || 0), 0);

    // --- DEBUG: Verificando o total calculado ---
    console.log('--- Total de Óbitos Calculado ---');
    console.log(totalObitos);

    // Assumindo que req.user é populado pelo middleware de autenticação
    const usuarioNome = (req as any).user?.nome || 'Usuário Desconhecido';

    const responseData = {
      estatisticas: estatisticasFinais,
      totalGeralEstatisticas,
      obitos: obitos.map(o => ({ ...o, natureza_nome: o.natureza.subgrupo, obm_nome: o.obm?.nome })),
      totalObitos,
      destaques: detalhadas.map(d => ({ ...d, natureza_descricao: d.natureza.subgrupo, obm_nome: d.cidade.nome, crbm_nome: d.cidade.crbm.nome })),
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
    logger.error({ err: error, query: req.query }, 'Erro ao gerar relatório completo.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

