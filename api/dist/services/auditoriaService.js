"use strict";
// Caminho: api/src/services/auditoriaService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarAcao = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const prisma_1 = require("../lib/prisma"); // Import prisma
/**
 * Registra uma ação de auditoria no banco de dados.
 * @param req - O objeto de requisição, que deve conter as informações do usuário autenticado.
 * @param acao - Uma descrição clara da ação realizada (ex: 'CRIACAO_USUARIO').
 * @param detalhes - Um objeto com informações contextuais relevantes para a ação.
 */
const registrarAcao = async (req, acao, detalhes = {}) => {
    let usuario_id = null;
    let usuario_nome = 'N/A';
    if (req.usuario) {
        usuario_id = req.usuario.id;
        usuario_nome = req.usuario.nome;
    }
    else if (detalhes.email) {
        // If user is not in request (e.g. failed login), try to find user by email
        const usuario = await prisma_1.prisma.usuario.findUnique({ where: { email: detalhes.email } });
        if (usuario) {
            usuario_id = usuario.id;
            usuario_nome = usuario.nome;
        }
    }
    try {
        const query = `
      INSERT INTO auditoria_logs (usuario_id, usuario_nome, acao, detalhes)
      VALUES ($1, $2, $3, $4)
    `;
        // Garante JSON válido ao inserir na coluna jsonb
        const detalhesJson = JSON.stringify(detalhes ?? {});
        await db_1.default.query(query, [usuario_id, usuario_nome || 'Nome não disponível', acao, detalhesJson]);
        logger_1.default.info({ auditoria: { usuario_id, acao, detalhes } }, 'Ação de auditoria registrada com sucesso.');
    }
    catch (error) {
        // Loga o erro mas não interrompe a operação principal do usuário.
        // A falha em registrar um log não deve impedir a ação principal de ser concluída.
        logger_1.default.error({
            err: error,
            auditoria: { usuario_id, acao, detalhes }
        }, 'Falha ao registrar ação de auditoria.');
    }
};
exports.registrarAcao = registrarAcao;
