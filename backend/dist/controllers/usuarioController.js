"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirUsuario = exports.atualizarUsuario = exports.criarUsuario = exports.listarUsuarios = void 0;
const db_1 = __importDefault(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const listarUsuarios = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT id, nome, email, criado_em FROM usuarios ORDER BY nome ASC');
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listarUsuarios = listarUsuarios;
const criarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;
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
        const query = 'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em';
        const { rows } = await db_1.default.query(query, [nome, email, senha_hash]);
        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
    }
    catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarUsuario = criarUsuario;
const atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, email } = req.body;
    if (!nome || !email) {
        res.status(400).json({ message: 'Nome e email são obrigatórios.' });
        return;
    }
    try {
        const query = 'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, criado_em';
        const { rows } = await db_1.default.query(query, [nome, email, id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso!', usuario: rows[0] });
    }
    catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarUsuario = atualizarUsuario;
const excluirUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const plantaoCheck = await db_1.default.query('SELECT usuario_id FROM supervisor_plantao WHERE usuario_id = $1', [id]);
        if (plantaoCheck.rows.length > 0) {
            res.status(400).json({ message: 'Não é possível excluir o usuário que está definido como supervisor de plantão. Remova-o do plantão primeiro.' });
            return;
        }
        const result = await db_1.default.query('DELETE FROM usuarios WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }
        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir usuário:', error);
        if (error.code === '23503') {
            res.status(400).json({ message: 'Não é possível excluir este usuário, pois ele está associado a outros registros no sistema.' });
            return;
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.excluirUsuario = excluirUsuario;
