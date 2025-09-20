import { Request, Response } from 'express';
import db from '../db';

interface DashboardStats {
  totalOcorrencias: number;
  totalObitos: number;
  ocorrenciasPorNatureza: { nome: string; total: number }[];
  ocorrenciasPorCrbm: { nome: string; total: number }[];
}

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // CORREÇÃO: A query foi reestruturada para somar óbitos de ambas as tabelas
    const query = `
      WITH total_ocorrencias_gerais AS (
        -- Conta apenas as ocorrências que NÃO são do relatório de óbitos
        SELECT COUNT(o.id) AS total 
        FROM ocorrencias o
        LEFT JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        WHERE n.grupo != 'Relatório de Óbitos'
      ),
      total_obitos_registros AS (
        -- Soma as vítimas da tabela específica de óbitos
        SELECT SUM(quantidade_vitimas) AS total FROM obitos_registros
      ),
      total_obitos_ocorrencias AS (
        -- Soma os óbitos da tabela geral (caso existam)
        SELECT SUM(quantidade_obitos) AS total FROM ocorrencias
      ),
      ocorrencias_por_natureza AS (
        SELECT
          n.subgrupo AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        WHERE n.grupo != 'Relatório de Óbitos' -- Exclui os óbitos da contagem por natureza
        GROUP BY nome
        ORDER BY total DESC
      ),
      ocorrencias_por_crbm AS (
        SELECT
          cr.nome AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN cidades c ON o.cidade_id = c.id
        JOIN crbms cr ON c.crbm_id = cr.id
        WHERE o.natureza_id NOT IN (SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos') -- Exclui os óbitos da contagem por CRBM
        GROUP BY cr.nome
        ORDER BY total DESC
      )
      SELECT json_build_object(
        'totalOcorrencias', COALESCE((SELECT total FROM total_ocorrencias_gerais), 0),
        'totalObitos', COALESCE((SELECT total FROM total_obitos_registros), 0) + COALESCE((SELECT total FROM total_obitos_ocorrencias), 0),
        'ocorrenciasPorNatureza', COALESCE((SELECT json_agg(ocorrencias_por_natureza) FROM ocorrencias_por_natureza), '[]'::json),
        'ocorrenciasPorCrbm', COALESCE((SELECT json_agg(ocorrencias_por_crbm) FROM ocorrencias_por_crbm), '[]'::json)
      ) AS stats;
    `;

    const { rows } = await db.query(query);
    const stats: DashboardStats = rows[0].stats;
    
    res.status(200).json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
  }
};
