"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger")); // <-- IMPORTE O LOGGER
const checkHealth = async (_req, res) => {
    try {
        await db_1.default.query('SELECT 1');
        res.status(200).json({
            status: 'ok',
            message: 'API está saudável e conectada ao banco de dados.'
        });
    }
    catch (error) {
        // USE O LOGGER PARA REGISTRAR O ERRO COMPLETO
        logger_1.default.error({ err: error }, '❌ Health Check falhou: Falha na conexão com o banco de dados.');
        res.status(503).json({
            status: 'error',
            message: 'API está com problemas. Falha na conexão com o banco de dados.'
        });
    }
};
exports.checkHealth = checkHealth;
