"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// api/src/db/index.ts
const pg_1 = require("pg");
const logger_1 = __importDefault(require("../config/logger"));
// Garante que as variáveis de ambiente sejam carregadas antes do pool
require("../config/envLoader");
// Usa explicitamente a connectionString para evitar problemas quando
// o processo é iniciado fora do diretório api/.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    logger_1.default.error('[DB] DATABASE_URL não definida. Verifique seu arquivo .env');
}
const config = {
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
const pool = new pg_1.Pool(config);
pool.on('connect', () => {
    logger_1.default.info('Nova conexão com o banco de dados estabelecida pelo pool.');
});
pool.on('error', (err) => {
    logger_1.default.error({ err }, 'Erro inesperado no cliente do pool de banco de dados.');
});
exports.default = {
    query: (text, params) => pool.query(text, params),
    pool,
};
// Garante a existência da tabela de auditoria em ambientes de desenvolvimento
// para evitar erro 42P01 (relation does not exist) quando o banco está limpo.
(async () => {
    try {
        const createSQL = `
      CREATE TABLE IF NOT EXISTS auditoria_logs (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        usuario_nome VARCHAR(100),
        acao VARCHAR(120) NOT NULL,
        detalhes JSONB DEFAULT '{}'::jsonb,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
        await pool.query(createSQL);
        logger_1.default.info('[DB] auditoria_logs verificada/criada.');
    }
    catch (err) {
        logger_1.default.warn({ err }, '[DB] Falha ao garantir a tabela auditoria_logs.');
    }
})();
