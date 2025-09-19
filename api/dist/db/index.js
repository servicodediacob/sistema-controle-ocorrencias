"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
require("dotenv/config");
const isProduction = process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech'));
const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};
console.log(`[DIAGNÓSTICO DB] Conectando ao banco de dados. Produção: ${isProduction}. SSL: ${connectionConfig.ssl !== false}.`);
// CORREÇÃO 1: Exporta a constante 'pool' diretamente.
exports.pool = new pg_1.Pool(connectionConfig);
// CORREÇÃO 2: Cria um objeto 'db' para manter a compatibilidade com o resto do código.
const db = {
    query: (text, params) => exports.pool.query(text, params),
    pool: exports.pool,
};
// CORREÇÃO 3: Exporta 'db' como default.
exports.default = db;
