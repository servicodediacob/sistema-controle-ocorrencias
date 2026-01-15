"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSisgpoSsoTtlSeconds = exports.fetchSisgpoSessionToken = exports.generateSisgpoSsoToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../config/logger"));
const prisma_1 = require("../lib/prisma");
const SISGPO_API_URL = (process.env.SISGPO_API_URL || 'http://localhost:3333').trim();
const SHARED_SECRET = process.env.SSO_SHARED_SECRET;
const SISGPO_SSO_TTL_SECONDS = Number(process.env.SISGPO_SSO_TTL_SECONDS || 90);
const resolveUserEmail = async (usuario) => {
    if (usuario?.email) {
        return usuario.email;
    }
    if (usuario?.id) {
        const userRecord = await prisma_1.prisma.usuario.findUnique({
            where: { id: usuario.id },
            select: { email: true },
        });
        if (userRecord?.email) {
            return userRecord.email;
        }
    }
    throw new Error('O usuário autenticado não possui e-mail cadastrado para integração com o SISGPO.');
};
const generateSisgpoSsoToken = async (usuario, extraClaims = {}) => {
    if (!SHARED_SECRET) {
        throw new Error('SSO_SHARED_SECRET não configurado para integração com o SISGPO.');
    }
    const email = await resolveUserEmail(usuario);
    const payload = {
        sub: usuario?.id,
        nome: usuario?.nome,
        email,
        origem: 'sistema-ocorrencias',
        ...extraClaims,
    };
    return jsonwebtoken_1.default.sign(payload, SHARED_SECRET, { expiresIn: SISGPO_SSO_TTL_SECONDS });
};
exports.generateSisgpoSsoToken = generateSisgpoSsoToken;
const fetchSisgpoSessionToken = async (usuario) => {
    const ssoToken = await (0, exports.generateSisgpoSsoToken)(usuario);
    const targetUrl = `${SISGPO_API_URL}/api/auth/sso-login`;
    try {
        const response = await axios_1.default.post(targetUrl, {}, {
            headers: {
                Authorization: `Bearer ${ssoToken}`,
            },
        });
        if (!response.data?.token) {
            throw new Error('Resposta do SISGPO não contém token de sessão.');
        }
        return response.data.token;
    }
    catch (error) {
        const isConnectionError = error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';
        if (isConnectionError) {
            logger_1.default.error({ err: error, url: targetUrl, code: error?.code }, '[SISGPO] Falha ao conectar com o SISGPO. Verifique se o serviço está rodando e a URL está correta.');
        }
        else {
            logger_1.default.error({ err: error, url: targetUrl }, '[SISGPO] Falha ao obter token de sessão via SSO.');
        }
        throw error;
    }
};
exports.fetchSisgpoSessionToken = fetchSisgpoSessionToken;
const getSisgpoSsoTtlSeconds = () => SISGPO_SSO_TTL_SECONDS;
exports.getSisgpoSsoTtlSeconds = getSisgpoSsoTtlSeconds;
