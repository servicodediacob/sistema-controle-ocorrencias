"use strict";
// Caminho: api/src/controllers/usuarioController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirUsuario = exports.atualizarUsuario = exports.criarUsuario = exports.listarUsuarios = void 0;
const db_1 = __importDefault(require("@/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("@/config/logger"));
// 2. ATUALIZAR A ASSINATURA DA FUNÇÃO
const listarUsuarios = async (_req, res) => {
    try {
        const query = `
      SELECT u.id, u.nome, u.email, u.role, u.criado_em, o.nome as obm_nome
      FROM usuarios u
      LEFT JOIN obms o ON u.obm_id = o.id
      ORDER BY u.nome ASC;
    `;
        const { rows } = await db_1.default.query(query);
        res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao listar usuários.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listarUsuarios = listarUsuarios;
// 3. ATUALIZAR AS OUTRAS FUNÇÕES NO MESMO ARQUIVO POR CONSISTÊNCIA
const criarUsuario = async (req, res) => {
    const { nome, email, senha, role = 'user', obm_id = null } = req.body;
    if (!nome || !email || !senha) {
        res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
        return;
    }
    try {
        const userExists = await db_1.default.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            res.status(409).json({ message: 'Este email já está em uso.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const senha_hash = await bcryptjs_1.default.hash(senha, salt);
        const query = 'INSERT INTO usuarios (nome, email, senha_hash, role, obm_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, role, obm_id, criado_em';
        const { rows } = await db_1.default.query(query, [nome, email, senha_hash, role, obm_id]);
        logger_1.default.info({ usuario: rows[0] }, 'Novo usuário criado.');
        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar usuário.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarUsuario = criarUsuario;
const atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, email, role, obm_id } = req.body;
    if (!nome || !email || !role) {
        res.status(400).json({ message: 'Nome, email e role são obrigatórios.' });
        return;
    }
    try {
        const query = `
      UPDATE usuarios 
      SET nome = $1, email = $2, role = $3, obm_id = $4
      WHERE id = $5 
      RETURNING id, nome, email, role, obm_id, criado_em
    `;
        const values = [nome, email, role, obm_id || null, id];
        const { rows } = await db_1.default.query(query, values);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }
        logger_1.default.info({ usuario: rows[0] }, 'Usuário atualizado.');
        res.status(200).json({ message: 'Usuário atualizado com sucesso!', usuario: rows[0] });
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar usuário.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarUsuario = atualizarUsuario;
// A função excluirUsuario já estava correta, mas é bom confirmar.
const excluirUsuario = async (req, res) => {
    const { id } = req.params;
    const idNumerico = parseInt(id, 10);
    if (req.usuario?.id === idNumerico) {
        res.status(400).json({ message: 'Você não pode excluir a si mesmo.' });
        return;
    }
    try {
        const plantaoCheck = await db_1.default.query('SELECT usuario_id FROM supervisor_plantao WHERE usuario_id = $1', [idNumerico]);
        if (plantaoCheck.rows.length > 0) {
            res.status(400).json({ message: 'Não é possível excluir o usuário que está definido como supervisor de plantão. Remova-o do plantão primeiro.' });
            return;
        }
        const result = await db_1.default.query('DELETE FROM usuarios WHERE id = $1', [idNumerico]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }
        logger_1.default.info({ usuarioIdExcluido: id, adminId: req.usuario?.id }, 'Usuário excluído com sucesso.');
        res.status(204).send();
    }
    catch (error) {
        if (error.code === '23503') {
            logger_1.default.warn({ usuarioIdExcluido: id }, 'Tentativa de excluir usuário com registros associados.');
            res.status(400).json({ message: 'Não é possível excluir este usuário, pois ele está associado a outros registros no sistema (ocorrências, etc.).' });
            return;
        }
        logger_1.default.error({ err: error, usuarioId: id }, 'Erro ao excluir usuário.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.excluirUsuario = excluirUsuario;
