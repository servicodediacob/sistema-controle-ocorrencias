// backend/src/controllers/dashboardController.js

const db = require('../db');

/**
 * @desc    Buscar estatísticas agregadas para o dashboard
 * @route   GET /api/dashboard/stats
 * @access  Privado (requer token JWT)
 */
const getDashboardStats = async (req, res) => {
  try {
    // Esta é a nossa consulta SQL principal. Vamos detalhá-la:
    // 1. Usamos várias CTEs (Common Table Expressions) com a cláusula WITH para calcular cada métrica separadamente.
    // 2. `total_ocorrencias`: Simplesmente conta todas as linhas da tabela 'ocorrencias'.
    // 3. `total_obitos`: Soma a coluna 'quantidade_obitos' da tabela 'ocorrencias'.
    // 4. `ocorrencias_por_natureza`: Agrupa as ocorrências por 'natureza_id', junta com a tabela 'naturezas_ocorrencia'
    //    para obter o nome da natureza e conta o total para cada uma.
    // 5. `ocorrencias_por_obm`: Faz o mesmo, mas agrupando por 'obm_id' e juntando com a tabela 'obms'.
    // 6. No final, usamos `json_build_object` para construir um único objeto JSON com todos os resultados,
    //    o que nos permite retornar tudo em uma única linha e uma única consulta.
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
          COUNT(o.id) AS total
        FROM ocorrencias o
        JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
        GROUP BY n.descricao
        ORDER BY total DESC
      ),
      ocorrencias_por_obm AS (
        SELECT
          obm.nome AS nome,
          COUNT(o.id) AS total
        FROM ocorrencias o
        JOIN obms obm ON o.obm_id = obm.id
        GROUP BY obm.nome
        ORDER BY total DESC
      )
      SELECT json_build_object(
        'totalOcorrencias', (SELECT total FROM total_ocorrencias),
        'totalObitos', (SELECT COALESCE(total, 0) FROM total_obitos),
        'ocorrenciasPorNatureza', (SELECT json_agg(ocorrencias_por_natureza) FROM ocorrencias_por_natureza),
        'ocorrenciasPorOBM', (SELECT json_agg(ocorrencias_por_obm) FROM ocorrencias_por_obm)
      ) AS stats;
    `;

    const { rows } = await db.query(query);

    // O resultado da consulta é um único objeto JSON na primeira linha/coluna.
    // Se não houver dados, alguns campos podem ser nulos, então garantimos que sejam arrays vazios.
    const stats = rows[0].stats;
    if (!stats.ocorrenciasPorNatureza) {
      stats.ocorrenciasPorNatureza = [];
    }
    if (!stats.ocorrenciasPorOBM) {
      stats.ocorrenciasPorOBM = [];
    }
    
    res.status(200).json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
  }
};

module.exports = {
  getDashboardStats,
};
