"use strict";
// Caminho: api/src/controllers/auditoriaController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarLogs = exports.registrarGeracaoRelatorio = exports.registrarAberturaChat = exports.registrarFechamentoChat = exports.registrarMensagemChat = exports.registrarNavegacao = void 0;
const auditoriaService_1 = require("../services/auditoriaService");
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const registrarNavegacao = async (req, res) => {
    const { pathname, search } = req.body;
    // The user is available in req.usuario due to the `proteger` middleware
    await (0, auditoriaService_1.registrarAcao)(req, 'NAVEGACAO', { pathname, search });
    res.sendStatus(204);
};
exports.registrarNavegacao = registrarNavegacao;
const registrarMensagemChat = async (req, res) => {
    const { partnerId, message } = req.body;
    await (0, auditoriaService_1.registrarAcao)(req, 'CHAT_MENSAGEM', { partnerId, message });
    res.sendStatus(204);
};
exports.registrarMensagemChat = registrarMensagemChat;
const registrarFechamentoChat = async (req, res) => {
    const { partnerId } = req.body;
    await (0, auditoriaService_1.registrarAcao)(req, 'CHAT_FECHAMENTO', { partnerId });
    res.sendStatus(204);
};
exports.registrarFechamentoChat = registrarFechamentoChat;
const registrarAberturaChat = async (req, res) => {
    const { partnerId } = req.body;
    await (0, auditoriaService_1.registrarAcao)(req, 'CHAT_ABERTURA', { partnerId });
    res.sendStatus(204);
};
exports.registrarAberturaChat = registrarAberturaChat;
const registrarGeracaoRelatorio = async (req, res) => {
    const { tipo, filtros, assinatura } = req.body;
    await (0, auditoriaService_1.registrarAcao)(req, 'GERACAO_RELATORIO', { tipo, filtros, assinatura });
    res.sendStatus(204);
};
exports.registrarGeracaoRelatorio = registrarGeracaoRelatorio;
const listarLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    try {
        const logsQuery = `
      SELECT
        al.id,
        al.usuario_nome,
        o.nome as obm_nome,
        al.acao,
        al.detalhes,
        al.criado_em
      FROM
        auditoria_logs al
      LEFT JOIN
        usuarios u ON al.usuario_id = u.id
      LEFT JOIN
        obms o ON u.obm_id = o.id
      ORDER BY
        al.criado_em DESC
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
