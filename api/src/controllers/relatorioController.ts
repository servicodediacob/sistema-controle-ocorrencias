import { Request, Response } from 'express';
import db from '../db';
import logger from '../config/logger';

export const getRelatorioCompleto = async (req: Request, res: Response): Promise<void> => {
  const { data_inicio, data_fim } = req.query;

  if (!data_inicio || !data_fim) {
    res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    return;
  }

  try {
    // Query para as estatísticas de ocorrências (lógica unificada)
    const estatisticasQuery = `
      WITH dados_unificados AS (
        -- 1. Seleciona dados dos lançamentos em lote (estatisticas_diarias)
        SELECT 
          ed.natureza_id,
          ed.quantidade,
          o.nome AS obm_nome,
          o.crbm_id
        FROM estatisticas_diarias ed
        JOIN obms o ON ed.obm_id = o.id
        WHERE ed.data_registro BETWEEN $1 AND $2

        UNION ALL

        -- 2. Seleciona dados dos lançamentos detalhados (ocorrencias_detalhadas)
        SELECT 
          od.natureza_id,
          1 AS quantidade, -- Cada linha conta como 1 ocorrência
          o.nome AS obm_nome,
          o.crbm_id
        FROM ocorrencias_detalhadas od
        JOIN obms o ON od.cidade_id = o.id
        WHERE od.data_ocorrencia BETWEEN $1 AND $2
      )
      -- 3. Agora, agrega os dados já unificados
      SELECT
        n.grupo,
        n.subgrupo,
        COALESCE(SUM(CASE WHEN du.obm_nome = 'Goiânia - Diurno' THEN du.quantidade ELSE 0 END), 0)::int AS diurno,
        COALESCE(SUM(CASE WHEN du.obm_nome = 'Goiânia - Noturno' THEN du.quantidade ELSE 0 END), 0)::int AS noturno,
        COALESCE(SUM(CASE WHEN cr.nome = '1º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS total_capital,
        COALESCE(SUM(CASE WHEN cr.nome = '1º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "1º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '2º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "2º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '3º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "3º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '4º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "4º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '5º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "5º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '6º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "6º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '7º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "7º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '8º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "8º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '9º CRBM' THEN du.quantidade ELSE 0 END), 0)::int AS "9º CRBM",
        COALESCE(SUM(du.quantidade), 0)::int AS total_geral
      FROM naturezas_ocorrencia n
      LEFT JOIN dados_unificados du ON n.id = du.natureza_id
      LEFT JOIN crbms cr ON du.crbm_id = cr.id
      WHERE n.grupo != 'Relatório de Óbitos'
      GROUP BY n.grupo, n.subgrupo
      ORDER BY
        CASE n.grupo
          WHEN 'Resgate' THEN 1
          WHEN 'Incêndio' THEN 2
          WHEN 'Busca e Salvamento' THEN 3
          WHEN 'Ações Preventivas' THEN 4
          WHEN 'Atividades Técnicas' THEN 5
          WHEN 'Produtos Perigosos' THEN 6
          WHEN 'Defesa Civil' THEN 7
          ELSE 8
        END,
        n.subgrupo;
    `;

    // ======================= INÍCIO DA CORREÇÃO =======================
    // Query para os registros de óbitos no período (código completo)
    const obitosQuery = `
      SELECT 
        obr.id,
        obr.data_ocorrencia,
        n.subgrupo as natureza_nome,
        obr.numero_ocorrencia,
        o.nome as obm_nome,
        obr.quantidade_vitimas
      FROM obitos_registros obr
      JOIN naturezas_ocorrencia n ON obr.natureza_id = n.id
      LEFT JOIN obms o ON obr.obm_id = o.id
      WHERE obr.data_ocorrencia BETWEEN $1 AND $2
      ORDER BY obr.data_ocorrencia DESC, n.subgrupo;
    `;

    // Query para as ocorrências de destaque no período (código completo)
    const destaquesQuery = `
      SELECT 
        od.id,
        od.data_ocorrencia,
        n.subgrupo as natureza_descricao,
        obm.nome as obm_nome,
        cr.nome as crbm_nome
      FROM ocorrencias_detalhadas od
      JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      JOIN obms obm ON od.cidade_id = obm.id
      JOIN crbms cr ON obm.crbm_id = cr.id
      WHERE od.id IN (SELECT ocorrencia_id FROM ocorrencia_destaque WHERE ocorrencia_id IS NOT NULL)
      AND od.data_ocorrencia BETWEEN $1 AND $2
      ORDER BY od.data_ocorrencia DESC;
    `;
    // ======================= FIM DA CORREÇÃO =======================

    // Executa todas as queries em paralelo
    const [
      estatisticasResult,
      obitosResult,
      destaquesResult
    ] = await Promise.all([
      db.query(estatisticasQuery, [data_inicio, data_fim]),
      db.query(obitosQuery, [data_inicio, data_fim]),
      db.query(destaquesQuery, [data_inicio, data_fim])
    ]);

    const relatorioCompleto = {
      estatisticas: estatisticasResult.rows,
      obitos: obitosResult.rows,
      destaques: destaquesResult.rows,
    };

    res.status(200).json(relatorioCompleto);

  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao gerar relatório completo');
    res.status(500).json({ message: 'Erro interno do servidor ao gerar o relatório completo.' });
  }
};
