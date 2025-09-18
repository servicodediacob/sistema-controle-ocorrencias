"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const db_1 = __importDefault(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const login = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        return;
    }
    try {
        const result = await db_1.default.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];
        if (!usuario) {
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
        delete usuario.senha_hash;
        res.status(200).json({ usuario, token });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.login = login;
