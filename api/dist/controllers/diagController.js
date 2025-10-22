"use strict";
// api/src/controllers/diagController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDiagnostics = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const toDurationMs = (elapsed) => {
    const duration = (elapsed[0] * 1000) + (elapsed[1] / 1000000);
    return parseFloat(duration.toFixed(2));
};
// Helper to measure the execution time of a promise and return it alongside the result.
const timePromise = async (promise) => {
    const start = process.hrtime();
    try {
        const result = await promise;
        const end = process.hrtime(start);
        return [result, toDurationMs(end)];
    }
    catch (error) {
        const end = process.hrtime(start);
        throw { error, duration: toDurationMs(end) };
    }
};
const stringifyDetails = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value ?? {});
    }
    catch (err) {
        return 'Nao foi possivel serializar detalhes adicionais.';
    }
};
const checkSisgpoStatus = async () => {
    const url = process.env.SISGPO_HEALTH_URL;
    if (!url) {
        logger_1.default.warn('[Diag] SISGPO_HEALTH_URL nao configurada.');
        return {
            status: 'degraded',
            message: 'Variavel SISGPO_HEALTH_URL nao configurada.',
        };
    }
    const start = process.hrtime();
    try {
        const response = await axios_1.default.get(url, {
            timeout: 5000,
            validateStatus: () => true,
        });
        const durationMs = toDurationMs(process.hrtime(start));
        const data = response.data;
        const statusFlag = data?.status ?? data?.healthy;
        const isHealthy = response.status === 200 && (statusFlag === 'ok' || statusFlag === true);
        if (isHealthy) {
            return {
                status: 'ok',
                message: 'SISGPO respondeu com status OK.',
                durationMs,
            };
        }
        return {
            status: 'error',
            message: `Resposta inesperada do SISGPO (HTTP ${response.status}).`,
            durationMs,
            details: stringifyDetails(data),
        };
    }
    catch (error) {
        const durationMs = toDurationMs(process.hrtime(start));
        let details = 'Erro desconhecido.';
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            details = stringifyDetails(axiosError.response?.data ?? axiosError.message ?? 'Erro ao consultar SISGPO.');
        }
        else if (error instanceof Error) {
            details = error.message;
        }
        logger_1.default.error({ err: error }, '[Diag] Falha ao consultar health check do SISGPO.');
        return {
            status: 'degraded',
            message: 'SISGPO nao respondeu ao health check.',
            durationMs,
            details,
        };
    }
};
const runDiagnostics = async (_req, res) => {
    logger_1.default.info('Iniciando diagnostico geral do sistema...');
    const report = {
        geral: {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
        servicos: {
            database: { status: 'degraded', message: 'Verificacao nao executada' },
            auth: { status: 'degraded', message: 'Verificacao nao executada' },
            sisgpo: { status: 'degraded', message: 'Verificacao nao executada' },
        },
    };
    // 1. Diagnostico do banco de dados
    try {
        const [, duration] = await timePromise(db_1.default.query('SELECT NOW()'));
        report.servicos.database = {
            status: 'ok',
            message: 'Conexao bem-sucedida.',
            durationMs: duration,
        };
    }
    catch (err) {
        report.servicos.database = {
            status: 'error',
            message: 'Falha na conexao com o banco de dados.',
            durationMs: err.duration,
            details: err.error instanceof Error ? err.error.message : 'Erro desconhecido.',
        };
        report.geral.status = 'error';
        logger_1.default.error({ err: err.error }, 'Diagnostico falhou na verificacao do banco de dados.');
    }
    // 2. Diagnostico do sistema de autenticacao (JWT)
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('A variavel de ambiente JWT_SECRET nao esta definida.');
        }
        const testPayload = { id: 'test' };
        const testToken = jsonwebtoken_1.default.sign(testPayload, secret, { expiresIn: '1s' });
        jsonwebtoken_1.default.verify(testToken, secret);
        report.servicos.auth = {
            status: 'ok',
            message: 'Segredo JWT esta configurado e funcional.',
        };
    }
    catch (error) {
        report.servicos.auth = {
            status: 'error',
            message: 'Falha no sistema de autenticacao.',
            details: error.message,
        };
        report.geral.status = 'error';
        logger_1.default.error({ err: error }, 'Diagnostico falhou na verificacao do JWT.');
    }
    // 3. Diagnostico do SISGPO
    const sisgpoCheck = await checkSisgpoStatus();
    report.servicos.sisgpo = sisgpoCheck;
    if (sisgpoCheck.status === 'error') {
        report.geral.status = 'error';
    }
    else if (sisgpoCheck.status === 'degraded' && report.geral.status === 'ok') {
        report.geral.status = 'degraded';
    }
    const httpStatus = report.geral.status === 'error' ? 503 : 200;
    logger_1.default.info(`Diagnostico concluido com status: ${report.geral.status}`);
    res.status(httpStatus).json(report);
};
exports.runDiagnostics = runDiagnostics;
