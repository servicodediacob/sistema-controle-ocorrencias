"use strict";
// Caminho: api/src/controllers/diagController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDiagnostics = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
// Função auxiliar para medir o tempo de uma operação em milissegundos
const timePromise = async (promise) => {
    const start = process.hrtime();
    try {
        const result = await promise;
        const end = process.hrtime(start);
        const durationMs = (end[0] * 1000) + (end[1] / 1000000);
        return [result, parseFloat(durationMs.toFixed(2))];
    }
    catch (error) {
        const end = process.hrtime(start);
        const durationMs = (end[0] * 1000) + (end[1] / 1000000);
        // Re-lança o erro para ser pego pelo bloco catch principal, mas com a duração
        throw { error, duration: parseFloat(durationMs.toFixed(2)) };
    }
};
const runDiagnostics = async (_req, res) => {
    logger_1.default.info('Iniciando diagnóstico geral do sistema...');
    const report = {
        geral: {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
        servicos: {
            database: { status: 'degraded', message: 'Verificação não executada' },
            auth: { status: 'degraded', message: 'Verificação não executada' },
        },
    };
    // 1. Diagnóstico do Banco de Dados
    try {
        const [, duration] = await timePromise(db_1.default.query('SELECT NOW()'));
        report.servicos.database = {
            status: 'ok',
            message: 'Conexão bem-sucedida.',
            durationMs: duration,
        };
    }
    catch (e) {
        report.servicos.database = {
            status: 'error',
            message: 'Falha na conexão com o banco de dados.',
            durationMs: e.duration,
            details: e.error instanceof Error ? e.error.message : 'Erro desconhecido.',
        };
        report.geral.status = 'error';
        logger_1.default.error({ err: e.error }, 'Diagnóstico falhou na verificação do banco de dados.');
    }
    // 2. Diagnóstico do Sistema de Autenticação (JWT)
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('A variável de ambiente JWT_SECRET não está definida.');
        }
        // Simula a criação e verificação de um token
        const testPayload = { id: 'test' };
        const testToken = jsonwebtoken_1.default.sign(testPayload, secret, { expiresIn: '1s' });
        jsonwebtoken_1.default.verify(testToken, secret);
        report.servicos.auth = {
            status: 'ok',
            message: 'Segredo JWT está configurado e funcional.',
        };
    }
    catch (error) {
        report.servicos.auth = {
            status: 'error',
            message: 'Falha no sistema de autenticação.',
            details: error.message,
        };
        report.geral.status = 'error';
        logger_1.default.error({ err: error }, 'Diagnóstico falhou na verificação do JWT.');
    }
    const httpStatus = report.geral.status === 'ok' ? 200 : 503; // 503 Service Unavailable
    logger_1.default.info(`Diagnóstico concluído com status: ${report.geral.status}`);
    res.status(httpStatus).json(report);
};
exports.runDiagnostics = runDiagnostics;
