"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSupervisorPlantao = exports.getSupervisores = exports.getPlantao = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const getPlantao = async (_req, res) => {
    try {
        const destaqueQuery = `
      SELECT 
        od.*,
        n.grupo as natureza_grupo,
        n.subgrupo as natureza_nome,
        c.nome as cidade_nome
      FROM ocorrencia_destaque d
      LEFT JOIN ocorrencias_detalhadas od ON d.ocorrencia_id = od.id
      LEFT JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      LEFT JOIN obms c ON od.cidade_id = c.id
      WHERE d.id = 1 AND d.ocorrencia_id IS NOT NULL;
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
        logger_1.default.error({ err: error }, 'Erro ao buscar dados do plantão.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getPlantao = getPlantao;
const getSupervisores = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query("SELECT id, nome FROM usuarios WHERE role = 'admin' ORDER BY nome ASC");
        res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar lista de supervisores.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getSupervisores = getSupervisores;
const setSupervisorPlantao = async (req, res) => {
    const { usuario_id } = req.body;
    try {
        const query = 'UPDATE supervisor_plantao SET usuario_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
        const { rows } = await db_1.default.query(query, [usuario_id]);
        logger_1.default.info({ novoSupervisorId: usuario_id }, 'Supervisor de plantão atualizado.');
        res.status(200).json(rows[0]);
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao definir supervisor de plantão.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.setSupervisorPlantao = setSupervisorPlantao;
