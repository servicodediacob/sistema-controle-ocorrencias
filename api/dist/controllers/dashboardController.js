"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../db"));
// ======================= FIM DA CORREÇÃO =======================
const getDashboardStats = async (_req, res) => {
    try {
        const query = `
      WITH 
      naturezas_de_obito AS (
        SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos'
      ),
      ocorrencias_unificadas AS (
        SELECT natureza_id, quantidade, obm_id FROM estatisticas_diarias
        WHERE natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
        
        UNION ALL
        
        SELECT natureza_id, 1 AS quantidade, cidade_id AS obm_id FROM ocorrencias_detalhadas
        WHERE natureza_id NOT IN (SELECT id FROM naturezas_de_obito)
      ),
      total_ocorrencias_unificadas AS (
        SELECT COALESCE(SUM(quantidade), 0) AS total FROM ocorrencias_unificadas
      ),
      ocorrencias_por_natureza AS (
        SELECT
          n.subgrupo AS nome,
          SUM(ou.quantidade)::int AS total
        FROM ocorrencias_unificadas ou
        JOIN naturezas_ocorrencia n ON ou.natureza_id = n.id
        GROUP BY n.subgrupo
        ORDER BY total DESC
      ),
      ocorrencias_por_crbm AS (
        SELECT
          cr.nome,
          SUM(ou.quantidade)::int AS total
        FROM ocorrencias_unificadas ou
        JOIN obms ob ON ou.obm_id = ob.id
        JOIN crbms cr ON ob.crbm_id = cr.id
        GROUP BY cr.nome
        ORDER BY total DESC
      ),
      total_obitos_registros AS (
        SELECT COALESCE(SUM(quantidade_vitimas), 0) AS total FROM obitos_registros
      )
      SELECT json_build_object(
        'totalOcorrencias', (SELECT total FROM total_ocorrencias_unificadas),
        'totalObitos', (SELECT total FROM total_obitos_registros),
        'ocorrenciasPorNatureza', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_natureza) t), '[]'::json),
        'ocorrenciasPorCrbm', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_crbm) t), '[]'::json)
      ) AS stats;
    `;
        const { rows } = await db_1.default.query(query);
        const stats = rows[0].stats;
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
    }
};
exports.getDashboardStats = getDashboardStats;
