"use strict";
// Caminho: api/src/scripts/migrate.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Verificação de Segurança Rígida
//    O script agora se recusa a rodar se não estiver EXPLICITAMENTE em modo de teste.
if (process.env.NODE_ENV !== 'test') {
    logger_1.default.fatal('[Migrate] ERRO CRÍTICO DE SEGURANÇA: Este script é destrutivo e só pode ser executado em ambiente de teste (NODE_ENV=test). Abortando.');
    process.exit(1); // Encerra o processo com código de erro.
}
// ======================= FIM DA CORREÇÃO =======================
// A lógica de encontrar o schema continua a mesma, pois é usada pelos testes.
const candidateSchemaPaths = [
    path_1.default.resolve(__dirname, '../db/schema.sql'),
    path_1.default.resolve(__dirname, '../../src/db/schema.sql'),
    path_1.default.resolve(process.cwd(), 'api/src/db/schema.sql'),
    path_1.default.resolve(process.cwd(), 'src/db/schema.sql'),
    path_1.default.resolve(process.cwd(), 'db/schema.sql'),
];
let schemaPath;
try {
    schemaPath = (() => {
        for (const possiblePath of candidateSchemaPaths) {
            if (fs_1.default.existsSync(possiblePath)) {
                return possiblePath;
            }
        }
        const message = `[Migrate] Nao foi possivel localizar o arquivo schema.sql. Caminhos verificados: ${candidateSchemaPaths.join(', ')}`;
        throw new Error(message);
    })();
}
catch (error) {
    logger_1.default.error({ err: error }, '[Migrate] Falha ao resolver caminho do schema.');
    process.exit(1);
}
async function migrate() {
    logger_1.default.info('[Migrate] Iniciando aplicacao do schema do banco de dados para TESTES.');
    logger_1.default.info(`[Migrate] Utilizando schema localizado em: ${schemaPath}`);
    const client = await db_1.default.pool.connect();
    logger_1.default.info('[Migrate] Conectado ao banco de dados de teste.');
    try {
        logger_1.default.info('[Migrate] Lendo o arquivo de schema...');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf-8');
        logger_1.default.info('[Migrate] Executando o script de schema completo (APENAS PARA TESTES).');
        await client.query(schemaSql);
        logger_1.default.info('[Migrate] Schema de teste aplicado com sucesso.');
    }
    catch (error) {
        logger_1.default.error({ err: error }, '[Migrate] Erro durante a aplicacao do schema de teste.');
        throw error;
    }
    finally {
        client.release();
        logger_1.default.info('[Migrate] Conexao com o banco de teste liberada.');
    }
}
migrate()
    .then(() => {
    logger_1.default.info('[Migrate] Migração de teste finalizada sem erros.');
    process.exit(0);
})
    .catch((err) => {
    logger_1.default.error({ err }, '[Migrate] Falha na migração de teste. Encerrando processo.');
    process.exit(1);
});
