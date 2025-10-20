"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySsoJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET;
const EXPECTED_ISSUER = process.env.SSO_ISSUER || 'sisgpo';
const EXPECTED_AUDIENCE = process.env.SSO_AUDIENCE || 'ocorrencias';
const verifySsoJwt = (req, res, next) => {
    if (!SSO_SHARED_SECRET) {
        res
            .status(500)
            .json({ message: 'SSO configuration missing on servidor de ocorrencias.' });
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'SSO token ausente ou mal formatado.' });
        return;
    }
    const token = authHeader.substring('Bearer '.length).trim();
    try {
        const payload = jsonwebtoken_1.default.verify(token, SSO_SHARED_SECRET, {
            audience: EXPECTED_AUDIENCE,
            issuer: EXPECTED_ISSUER,
        });
        req.ssoPayload = payload;
        next();
    }
    catch (error) {
        const message = error instanceof jsonwebtoken_1.default.TokenExpiredError
            ? 'SSO token expirado.'
            : 'SSO token inválido.';
        res.status(401).json({ message });
    }
};
exports.verifySsoJwt = verifySsoJwt;
exports.default = exports.verifySsoJwt;
