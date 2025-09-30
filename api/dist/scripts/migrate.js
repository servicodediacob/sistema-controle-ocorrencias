"use strict";
// Caminho: api/src/scripts/migrate.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Caminhos relativos a partir de 'src/scripts/'
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const isProduction = process.env.NODE_ENV === 'production';
const allowSchemaReset = process.env.ALLOW_SCHEMA_RESET === 'true';
if (isProduction && !allowSchemaReset) {
    logger_1.default.warn('[Migrate] Migracao destrutiva detectada. Abortando porque NODE_ENV=production e ALLOW_SCHEMA_RESET nao esta definido como "true".');
    process.exit(0);
}
const SCHEMA_FILE_PATH = path_1.default.join(process.cwd(), 'src/db/schema.sql');
async function migrate() {
    logger_1.default.info('[Migrate] Iniciando aplicacao do schema do banco de dados.');
    logger_1.default.info(`[Migrate] Procurando schema em: ${SCHEMA_FILE_PATH}`);
    const client = await db_1.default.pool.connect();
    logger_1.default.info('[Migrate] Conectado ao banco de dados.');
    try {
        logger_1.default.info('[Migrate] Lendo o arquivo de schema...');
        const schemaSql = fs_1.default.readFileSync(SCHEMA_FILE_PATH, 'utf-8');
        logger_1.default.info('[Migrate] Executando o script de schema completo.');
        await client.query(schemaSql);
        logger_1.default.info('[Migrate] Schema aplicado com sucesso.');
    }
    catch (error) {
        logger_1.default.error({ err: error }, '[Migrate] Erro durante a aplicacao do schema.');
        throw error;
    }
    finally {
        client.release();
        logger_1.default.info('[Migrate] Conexao com o banco liberada.');
    }
}
migrate()
    .then(() => {
    logger_1.default.info('[Migrate] Finalizado sem erros.');
    process.exit(0);
})
    .catch((err) => {
    logger_1.default.error('[Migrate] Falha na migracao. Encerrando processo.', err);
    process.exit(1);
});
