// backend/src/controllers/dashboardController.js

const db = require('../db');

/**
 * @desc    Buscar estatísticas agregadas para o dashboard
 * @route   GET /api/dashboard/stats
 * @access  Privado (requer token JWT)
 */
const getDashboardStats = async (req, res) => {
  try {
    // Consulta SQL CORRIGIDA e mais robusta para lidar com um banco de dados vazio.
    // Usamos COALESCE para garantir que, se uma subconsulta de agregação (json_agg)
    // não encontrar linhas e retornar NULL, ela seja substituída por um array JSON vazio ('[]'::json).
    const query = `
      WITH total_ocorrencias AS (
        SELECT COUNT(*) AS total FROM ocorrencias
      ),
      total_obitos AS (
        SELECT SUM(quantidade_obitos) AS total FROM ocorrencias
      ),
      ocorrencias_por_natureza AS (
        SELECT
          n.descricao AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        GROUP BY n.descricao
        ORDER BY total DESC
      ),
      ocorrencias_por_obm AS (
        SELECT
          obm.nome AS nome,
          COUNT(o.id)::int AS total
        FROM ocorrencias o
        JOIN obms obm ON o.obm_id = obm.id
        GROUP BY obm.nome
        ORDER BY total DESC
      )
      SELECT json_build_object(
        'totalOcorrencias', (SELECT total FROM total_ocorrencias),
        'totalObitos', (SELECT COALESCE(total, 0) FROM total_obitos),
        'ocorrenciasPorNatureza', COALESCE((SELECT json_agg(ocorrencias_por_natureza) FROM ocorrencias_por_natureza), '[]'::json),
        'ocorrenciasPorOBM', COALESCE((SELECT json_agg(ocorrencias_por_obm) FROM ocorrencias_por_obm), '[]'::json)
      ) AS stats;
    `;

    const { rows } = await db.query(query);

    // O resultado da consulta é um único objeto JSON na primeira linha/coluna.
    const stats = rows[0].stats;
    
    res.status(200).json(stats);

  } catch (error) {
    // Este log é crucial para debugar erros no ambiente de produção (visível nos logs do Render)
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
  }
};

module.exports = {
  getDashboardStats,
};
