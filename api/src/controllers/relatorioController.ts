// Caminho: api/src/controllers/relatorioController.ts

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
    // Query para as estatísticas de ocorrências (lógica já existente e otimizada)
    const estatisticasQuery = `
      SELECT
        n.grupo,
        n.subgrupo,
        COALESCE(SUM(ed.quantidade), 0) AS total_geral
      FROM naturezas_ocorrencia n
      LEFT JOIN estatisticas_diarias ed ON n.id = ed.natureza_id AND ed.data_registro BETWEEN $1 AND $2
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

    // Query para os registros de óbitos no período
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

    // Query para as ocorrências de destaque no período
    // (Esta é uma simplificação. Uma implementação real poderia requerer uma tabela de histórico de destaques)
    const destaquesQuery = `
      SELECT 
        o.id,
        o.data_ocorrencia,
        n.subgrupo as natureza_descricao,
        obm.nome as obm_nome,
        cr.nome as crbm_nome
      FROM ocorrencias o
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      JOIN obms obm ON o.obm_id = obm.id
      JOIN crbms cr ON obm.crbm_id = cr.id
      WHERE o.id IN (SELECT ocorrencia_id FROM ocorrencia_destaque WHERE ocorrencia_id IS NOT NULL)
      AND o.data_ocorrencia BETWEEN $1 AND $2
      ORDER BY o.data_ocorrencia DESC;
    `;

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

    // Monta o objeto de resposta final
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
