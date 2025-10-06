"use strict";
// Caminho: api/src/controllers/auditoriaController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarLogs = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const listarLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    try {
        const logsQuery = `
      SELECT id, usuario_nome, acao, detalhes, criado_em 
      FROM auditoria_logs
      ORDER BY criado_em DESC
      LIMIT $1 OFFSET $2;
    `;
        const totalQuery = 'SELECT COUNT(*) FROM auditoria_logs;';
        const [logsResult, totalResult] = await Promise.all([
            db_1.default.query(logsQuery, [limit, offset]),
            db_1.default.query(totalQuery)
        ]);
        const total = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            logs: logsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao listar logs de auditoria.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listarLogs = listarLogs;
