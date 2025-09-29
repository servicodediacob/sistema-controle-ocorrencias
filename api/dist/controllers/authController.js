"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const login = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }
    try {
        const { rows } = await db_1.default.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = rows[0];
        if (!usuario) {
            logger_1.default.warn({ email }, 'Tentativa de login com email não cadastrado.');
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            logger_1.default.warn({ email: usuario.email, id: usuario.id }, 'Tentativa de login com senha incorreta.');
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, role: usuario.role, obm_id: usuario.obm_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // Retorna os dados do usuário sem o hash da senha
        const { senha_hash, ...usuarioSemSenha } = usuario;
        logger_1.default.info({ user: { id: usuario.id, nome: usuario.nome } }, 'Usuário logado com sucesso.');
        return res.status(200).json({
            message: 'Login bem-sucedido!',
            usuario: usuarioSemSenha,
            token,
        });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro crítico no processo de login.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.login = login;
