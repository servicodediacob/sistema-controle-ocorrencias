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
    const timestamp = new Date().toISOString();
    // 1. Verifica conexão com o banco de dados (consulta simples)
    let database;
    try {
        const [, durationMs] = await timePromise(db_1.default.query('SELECT 1'));
        database = {
            status: 'ok',
            message: 'Consulta básica ao banco executada com sucesso.',
            durationMs,
        };
    }
    catch (err) {
        const failure = err;
        logger_1.default.error({ err: failure?.error ?? err }, '[Diag] Falha ao consultar o banco de dados.');
        database = {
            status: 'error',
            message: 'Falha ao executar consulta básica no banco de dados.',
            durationMs: failure?.duration,
            details: stringifyDetails(failure?.error),
        };
    }
    // 2. Valida configuração de autenticação (JWT secret)
    let auth;
    const authStart = process.hrtime();
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        auth = {
            status: 'error',
            message: 'JWT_SECRET não configurado.',
            durationMs: toDurationMs(process.hrtime(authStart)),
        };
    }
    else {
        try {
            const token = jsonwebtoken_1.default.sign({ ping: true }, jwtSecret, { expiresIn: '1m' });
            jsonwebtoken_1.default.verify(token, jwtSecret);
            auth = {
                status: 'ok',
                message: 'Segredo JWT válido.',
                durationMs: toDurationMs(process.hrtime(authStart)),
            };
        }
        catch (error) {
            logger_1.default.error({ err: error }, '[Diag] Falha ao validar JWT_SECRET.');
            auth = {
                status: 'error',
                message: 'Falha ao validar JWT_SECRET.',
                durationMs: toDurationMs(process.hrtime(authStart)),
                details: stringifyDetails(error instanceof Error ? error.message : error),
            };
        }
    }
    // 3. Consulta serviço externo SISGPO (se configurado)
    const sisgpo = await checkSisgpoStatus();
    const services = {
        database,
        auth,
        sisgpo,
    };
    const serviceStatuses = Object.values(services).map((svc) => svc.status);
    let geralStatus = 'ok';
    if (serviceStatuses.includes('error')) {
        geralStatus = 'error';
    }
    else if (serviceStatuses.includes('degraded')) {
        geralStatus = 'degraded';
    }
    const report = {
        geral: {
            status: geralStatus,
            timestamp,
        },
        servicos: services,
    };
    const statusCode = geralStatus === 'error' ? 500 : 200;
    res.status(statusCode).json(report);
};
exports.runDiagnostics = runDiagnostics;
