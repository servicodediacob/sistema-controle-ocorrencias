"use strict";
// api/src/controllers/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma"); // Importando o Prisma Client
const google_auth_library_1 = require("google-auth-library");
const socketService_1 = require("../services/socketService");
const logger_1 = __importDefault(require("../config/logger"));
const auditoriaService_1 = require("../services/auditoriaService");
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
            await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_FALHA', { email, motivo: 'Usuário não encontrado' });
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        // ======================= INÍCIO DA CORREÇÃO =======================
        // Adicionado 'await' para esperar o resultado da comparação da senha.
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha_hash);
        // ======================= FIM DA CORREÇÃO =======================
        if (!senhaValida) {
            await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_FALHA', { email, motivo: 'Senha inválida' });
            res.status(401).json({ message: 'Credenciais inválidas.' });
            return;
        }
        if (!process.env.JWT_SECRET) {
            logger_1.default.error('[AUTH] A variável de ambiente JWT_SECRET não está definida!');
            res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
            return;
        }
        // Attach user to request for audit logging
        req.usuario = usuario;
        await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_SUCESSO', { email });
        const tokenPayload = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            perfil: usuario.role, // Mantido para compatibilidade com frontend
            obm_id: usuario.obm_id ?? (usuario.obm ? usuario.obm.id : null),
            obm_nome: usuario.obm?.nome ?? null,
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
const googleLogin = async (req, res) => {
    const { id_token } = req.body;
    if (!id_token) {
        res.status(400).json({ message: 'id_token é obrigatório.' });
        return;
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        console.error('GOOGLE_CLIENT_ID não está definida. O login com Google não funcionará.');
        logger_1.default.error('[AUTH] GOOGLE_CLIENT_ID não definido no ambiente');
        res.status(500).json({ message: 'Configuração OAuth ausente.' });
        return;
    }
    try {
        const oauthClient = new google_auth_library_1.OAuth2Client(clientId);
        const ticket = await oauthClient.verifyIdToken({ idToken: id_token, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_GOOGLE_FALHA', { motivo: 'Token inválido' });
            res.status(401).json({ message: 'Token inválido.' });
            return;
        }
        const email = payload.email;
        const nome = payload.name || email.split('@')[0];
        // Usuário já existe? Faz login normal
        const usuario = await prisma_1.prisma.usuario.findUnique({ where: { email }, include: { obm: true } });
        if (usuario) {
            // Attach user to request for audit logging
            req.usuario = usuario;
            await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_GOOGLE_SUCESSO', { email });
            if (!process.env.JWT_SECRET) {
                res.status(500).json({ message: 'JWT_SECRET ausente.' });
                return;
            }
            const tokenPayload = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
                perfil: usuario.role,
                obm_id: usuario.obm_id ?? (usuario.obm ? usuario.obm.id : null),
                obm_nome: usuario.obm?.nome ?? null,
                obm: usuario.obm ? { id: usuario.obm.id, nome: usuario.obm.nome } : null,
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.status(200).json({ token });
            return;
        }
        // Não existe: sinaliza necessidade de aprovação
        await (0, auditoriaService_1.registrarAcao)(req, 'LOGIN_GOOGLE_PRIMEIRO_ACESSO', { email });
        // Opcional: notificar admins que houve tentativa de acesso Google ainda não cadastrada
        try {
            (0, socketService_1.notifyAdmins)('acesso:google-primeiro-login', { nome, email, quando: new Date().toISOString() });
        }
        catch (e) {
            logger_1.default.warn({ err: e }, '[AUTH] Falha ao notificar admins sobre first-login Google');
        }
        res.status(200).json({ needsApproval: true, profile: { nome, email } });
    }
    catch (error) {
        logger_1.default.error({ err: error }, '[AUTH] Erro ao verificar token Google');
        res.status(401).json({ message: 'Falha na autenticação Google.' });
    }
};
exports.googleLogin = googleLogin;
