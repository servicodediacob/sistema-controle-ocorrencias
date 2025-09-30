// Caminho: api/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
// Caminhos relativos a partir de 'src/scripts/'
import db from '../db';
import logger from '../config/logger';

const isProduction = process.env.NODE_ENV === 'production';
const allowSchemaReset = process.env.ALLOW_SCHEMA_RESET === 'true';

if (isProduction && !allowSchemaReset) {
  logger.warn('[Migrate] Migracao destrutiva detectada. Abortando porque NODE_ENV=production e ALLOW_SCHEMA_RESET nao esta definido como "true".');
  process.exit(0);
}

const SCHEMA_FILE_PATH = path.join(process.cwd(), 'src/db/schema.sql');

async function migrate() {
  logger.info('[Migrate] Iniciando aplicacao do schema do banco de dados.');
  logger.info(`[Migrate] Procurando schema em: ${SCHEMA_FILE_PATH}`);

  const client = await db.pool.connect();
  logger.info('[Migrate] Conectado ao banco de dados.');

  try {
    logger.info('[Migrate] Lendo o arquivo de schema...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');

    logger.info('[Migrate] Executando o script de schema completo.');
    await client.query(schemaSql);

    logger.info('[Migrate] Schema aplicado com sucesso.');
  } catch (error) {
    logger.error({ err: error }, '[Migrate] Erro durante a aplicacao do schema.');
    throw error;
  } finally {
    client.release();
    logger.info('[Migrate] Conexao com o banco liberada.');
  }
}

migrate()
  .then(() => {
    logger.info('[Migrate] Finalizado sem erros.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('[Migrate] Falha na migracao. Encerrando processo.', err);
    process.exit(1);
  });
