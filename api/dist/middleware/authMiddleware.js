"use strict";
// Caminho: api/src/middleware/authMiddleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proteger = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../config/logger"));
const proteger = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Anexa os dados do usuário decodificados ao objeto da requisição
            req.usuario = decoded;
            next();
            return;
        }
        catch (error) {
            logger_1.default.warn({ err: error, token }, 'Falha na autenticação do token.');
            res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
            return;
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};
exports.proteger = proteger;
