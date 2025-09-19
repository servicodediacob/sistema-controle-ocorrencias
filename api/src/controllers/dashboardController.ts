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
    const query = `
      WITH total_ocorrencias AS (
        SELECT COUNT(*) AS total FROM ocorrencias
      ),
      total_obitos AS (
        SELECT SUM(quantidade_obitos) AS total FROM ocorrencias
      ),
      ocorrencias_por_natureza AS (
        SELECT
          CONCAT(n.grupo, ' - ', n.subgrupo) AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        GROUP BY nome
        ORDER BY total DESC
      ),
      ocorrencias_por_crbm AS (
        SELECT
          cr.nome AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN cidades c ON o.cidade_id = c.id -- A linha crucial
        JOIN crbms cr ON c.crbm_id = cr.id
        GROUP BY cr.nome
        ORDER BY total DESC
      )
      SELECT json_build_object(
        'totalOcorrencias', (SELECT total FROM total_ocorrencias),
        'totalObitos', COALESCE((SELECT total FROM total_obitos), 0),
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
