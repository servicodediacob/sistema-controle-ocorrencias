"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSupervisorPlantao = exports.setOcorrenciaDestaque = exports.getSupervisores = exports.getPlantao = void 0;
const db_1 = __importDefault(require("../db"));
const getPlantao = async (_req, res) => {
    try {
        const destaqueQuery = `
      SELECT 
        od.ocorrencia_id,
        o.data_ocorrencia,
        n.descricao as natureza_descricao,
        obm.nome as obm_nome
      FROM ocorrencia_destaque od
      LEFT JOIN ocorrencias o ON od.ocorrencia_id = o.id
      LEFT JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      LEFT JOIN obms obm ON o.obm_id = obm.id
      WHERE od.id = 1;
    `;
        const supervisorQuery = `
      SELECT 
        sp.usuario_id,
        u.nome as supervisor_nome
      FROM supervisor_plantao sp
      LEFT JOIN usuarios u ON sp.usuario_id = u.id
      WHERE sp.id = 1;
    `;
        const [destaqueResult, supervisorResult] = await Promise.all([
            db_1.default.query(destaqueQuery),
            db_1.default.query(supervisorQuery)
        ]);
        res.status(200).json({
            ocorrenciaDestaque: destaqueResult.rows[0] || null,
            supervisorPlantao: supervisorResult.rows[0] || null,
        });
    }
    catch (error) {
        console.error('Erro ao buscar dados do plantão:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getPlantao = getPlantao;
const getSupervisores = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT id, nome FROM usuarios ORDER BY nome ASC');
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar supervisores:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getSupervisores = getSupervisores;
const setOcorrenciaDestaque = async (req, res) => {
    const { ocorrencia_id } = req.body;
    try {
        const query = 'UPDATE ocorrencia_destaque SET ocorrencia_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
        const { rows } = await db_1.default.query(query, [ocorrencia_id]);
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao definir ocorrência de destaque:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.setOcorrenciaDestaque = setOcorrenciaDestaque;
const setSupervisorPlantao = async (req, res) => {
    const { usuario_id } = req.body;
    try {
        const query = 'UPDATE supervisor_plantao SET usuario_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
        const { rows } = await db_1.default.query(query, [usuario_id]);
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao definir supervisor de plantão:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.setSupervisorPlantao = setSupervisorPlantao;
