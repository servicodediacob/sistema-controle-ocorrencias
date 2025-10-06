"use strict";
// Caminho: api/src/controllers/perfilController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alterarPropriaSenha = void 0;
const db_1 = __importDefault(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("../config/logger"));
const auditoriaService_1 = require("../services/auditoriaService");
const alterarPropriaSenha = async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuario?.id;
    if (!senhaAtual || !novaSenha) {
        res.status(400).json({ message: 'A senha atual e a nova senha são obrigatórias.' });
        return;
    }
    if (!usuarioId) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
    }
    try {
        const { rows } = await db_1.default.query('SELECT senha_hash FROM usuarios WHERE id = $1', [usuarioId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }
        // --- INÍCIO DA CORREÇÃO ---
        // Acessamos o primeiro (e único) resultado do array 'rows'
        const usuario = rows[0];
        const senhaValida = await bcryptjs_1.default.compare(senhaAtual, usuario.senha_hash);
        // --- FIM DA CORREÇÃO ---
        if (!senhaValida) {
            res.status(401).json({ message: 'A senha atual está incorreta.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const novaSenhaHash = await bcryptjs_1.default.hash(novaSenha, salt);
        await db_1.default.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaSenhaHash, usuarioId]);
        await (0, auditoriaService_1.registrarAcao)(req, 'ALTERACAO_PROPRIA_SENHA', {
            detalhe: `Usuário (ID: ${usuarioId}) alterou a própria senha.`
        });
        logger_1.default.info({ usuarioId }, 'Usuário alterou a própria senha com sucesso.');
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    }
    catch (error) {
        logger_1.default.error({ err: error, usuarioId }, 'Erro ao alterar a própria senha.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.alterarPropriaSenha = alterarPropriaSenha;
