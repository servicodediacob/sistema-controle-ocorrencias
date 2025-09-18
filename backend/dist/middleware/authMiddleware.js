"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proteger = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const proteger = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.usuario = { id: decoded.id, nome: decoded.nome };
            next();
            return; // Saída explícita após chamar next()
        }
        catch (error) {
            console.error('Erro de autenticação:', error.message);
            res.status(401).json({ message: 'Não autorizado, token inválido.' });
            return;
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
        return;
    }
};
exports.proteger = proteger;
