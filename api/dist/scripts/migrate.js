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
// O script compilado estará em 'dist/scripts/'. O schema estará em 'dist/db/'.
// O caminho relativo de um para o outro é '../db/schema.sql'.
// Usar path.join com __dirname torna o caminho absoluto e à prova de erros.
const SCHEMA_FILE_PATH = path_1.default.join(__dirname, '../db/schema.sql');
async function migrate() {
    logger_1.default.info('🚀 Iniciando a migração do schema do banco de dados...');
    logger_1.default.info(`🔍 Procurando schema em: ${SCHEMA_FILE_PATH}`);
    const client = await db_1.default.pool.connect();
    logger_1.default.info('✅ Conectado ao banco de dados.');
    try {
        logger_1.default.info('📄 Lendo o arquivo de schema (schema.sql)...');
        const schemaSql = fs_1.default.readFileSync(SCHEMA_FILE_PATH, 'utf-8');
        logger_1.default.info('🔄 Executando o script para criar/atualizar as tabelas...');
        await client.query(schemaSql);
        logger_1.default.info('🎉 Schema do banco de dados aplicado com sucesso!');
    }
    catch (error) {
        logger_1.default.error({ err: error }, '❌ Erro durante a migração do schema:');
        throw error;
    }
    finally {
        client.release();
        logger_1.default.info('🔌 Conexão com o banco de dados liberada.');
    }
}
migrate()
    .then(() => {
    logger_1.default.info('Migração concluída. O processo será encerrado.');
    process.exit(0);
})
    .catch((err) => {
    logger_1.default.error("A migração falhou. O processo de build será encerrado.", err);
    process.exit(1);
});
