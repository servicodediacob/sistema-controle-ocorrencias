"use strict";
// api/src/controllers/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma"); // Importando o Prisma Client
const logger_1 = __importDefault(require("@/config/logger"));
const login = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        return;
    }
    try {
        // Busca o usuário e sua OBM associada usando o Prisma
        const usuario = await prisma_1.prisma.usuario.findUnique({
            where: { email },
            include: {
                obm: true, // Inclui os dados da OBM relacionada
            },
        });
        if (!usuario) {
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        // ======================= INÍCIO DA CORREÇÃO =======================
        // Adicionado 'await' para esperar o resultado da comparação da senha.
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha_hash);
        // ======================= FIM DA CORREÇÃO =======================
        if (!senhaValida) {
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        if (!process.env.JWT_SECRET) {
            logger_1.default.error('[AUTH] A variável de ambiente JWT_SECRET não está definida!');
            res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
            return;
        }
        const tokenPayload = {
            id: usuario.id,
            nome: usuario.nome,
            role: usuario.role,
            perfil: usuario.role, // Mantido para compatibilidade com frontend
            obm: usuario.obm ? { id: usuario.obm.id, nome: usuario.obm.nome } : null,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        res.status(200).json({ token });
    }
    catch (error) {
        logger_1.default.error({ err: error }, `[AUTH] Erro inesperado durante o login para ${email}`);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.login = login;
