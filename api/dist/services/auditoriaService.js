"use strict";
// Caminho: api/src/services/auditoriaService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarAcao = void 0;
const db_1 = __importDefault(require("@/db"));
const logger_1 = __importDefault(require("@/config/logger"));
/**
 * Registra uma ação de auditoria no banco de dados.
 * @param req - O objeto de requisição, que deve conter as informações do usuário autenticado.
 * @param acao - Uma descrição clara da ação realizada (ex: 'CRIACAO_USUARIO').
 * @param detalhes - Um objeto com informações contextuais relevantes para a ação.
 */
const registrarAcao = async (req, acao, detalhes = {}) => {
    // Se não houver um usuário na requisição (ex: um script rodando sem autenticação), não faz nada.
    if (!req.usuario) {
        logger_1.default.warn({ acao, detalhes }, 'Tentativa de registrar ação de auditoria sem usuário autenticado.');
        return;
    }
    const { id: usuario_id, nome: usuario_nome } = req.usuario;
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
