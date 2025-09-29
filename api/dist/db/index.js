"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
require("../config/envLoader"); // Garante que as variáveis de ambiente sejam carregadas primeiro
const logger_1 = __importDefault(require("../config/logger"));
// 1. Validação da Variável de Ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    logger_1.default.fatal('ERRO FATAL: A variável de ambiente DATABASE_URL não está definida.');
    process.exit(1); // Encerra a aplicação se a URL do banco não existir
}
// 2. Determina se estamos em produção de forma mais segura
const isProduction = process.env.NODE_ENV === 'production';
// 3. Monta o objeto de configuração da conexão
const connectionConfig = {
    connectionString: databaseUrl,
    // Adiciona configuração SSL apenas em produção
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};
// 4. Log de diagnóstico aprimorado
logger_1.default.info({
    production_mode: isProduction,
    ssl_enabled: connectionConfig.ssl !== false,
    db_host: new URL(databaseUrl).hostname,
}, '[DB] Configurando pool de conexão.');
// 5. Cria o pool com a configuração correta
const pool = new pg_1.Pool(connectionConfig);
// Adiciona um listener para erros no pool
pool.on('error', (err) => {
    logger_1.default.error({ err }, 'Erro inesperado no cliente do pool de banco de dados');
});
// 6. Exporta o pool e uma função query para uso no restante da aplicação
exports.default = {
    query: (text, params) => pool.query(text, params),
    pool: pool,
};
