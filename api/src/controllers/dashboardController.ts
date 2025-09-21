// api/src/controllers/dashboardController.ts
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
    // CORREÇÃO: Troca todas as referências de 'cidades' para 'obms' e 'cidade_id' para 'obm_id'
    const query = `
      WITH 
      naturezas_de_obito AS (
        SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos'
      ),
      total_ocorrencias_gerais AS (
        SELECT COUNT(id) AS total 
        FROM ocorrencias 
        WHERE natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
      ),
      total_obitos_registros AS (
        SELECT SUM(quantidade_vitimas) AS total FROM obitos_registros
      ),
      ocorrencias_por_natureza AS (
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
        SELECT
          cr.nome AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN obms ob ON o.obm_id = ob.id
        JOIN crbms cr ON ob.crbm_id = cr.id
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
