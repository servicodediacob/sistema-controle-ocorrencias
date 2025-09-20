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
    // VERSÃO FINAL E MAIS SEGURA DA QUERY
    const query = `
      WITH 
      naturezas_de_obito AS (
        -- 1. Isola os IDs de todas as naturezas que são para óbitos
        SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos'
      ),
      total_ocorrencias_gerais AS (
        -- 2. Conta ocorrências EXCLUINDO as naturezas de óbito
        SELECT COUNT(id) AS total 
        FROM ocorrencias 
        WHERE natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
      ),
      total_obitos_registros AS (
        -- 3. Soma as vítimas da tabela específica de óbitos
        SELECT SUM(quantidade_vitimas) AS total FROM obitos_registros
      ),
      ocorrencias_por_natureza AS (
        -- 4. Agrupa por natureza, EXCLUINDO as naturezas de óbito
        SELECT
          n.subgrupo AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        WHERE o.natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
        GROUP BY nome
        ORDER BY total DESC
      ),
      ocorrencias_por_crbm AS (
        -- 5. Agrupa por CRBM, EXCLUINDO as naturezas de óbito
        SELECT
          cr.nome AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN cidades c ON o.cidade_id = c.id
        JOIN crbms cr ON c.crbm_id = cr.id
        WHERE o.natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
        GROUP BY cr.nome
        ORDER BY total DESC
      )
      SELECT json_build_object(
        'totalOcorrencias', COALESCE((SELECT total FROM total_ocorrencias_gerais), 0),
        'totalObitos', COALESCE((SELECT total FROM total_obitos_registros), 0),
        'ocorrenciasPorNatureza', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_natureza) t), '[]'::json),
        'ocorrenciasPorCrbm', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_crbm) t), '[]'::json)
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
