// Caminho: api/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
import db from '../db';
import logger from '../config/logger';

const isProduction = process.env.NODE_ENV === 'production';
const allowSchemaReset = process.env.ALLOW_SCHEMA_RESET === 'true';

if (isProduction && !allowSchemaReset) {
  logger.warn('[Migrate] Migracao destrutiva detectada. Abortando porque NODE_ENV=production e ALLOW_SCHEMA_RESET nao esta definido como "true".');
  process.exit(0);
}

const candidateSchemaPaths: string[] = [
  path.resolve(__dirname, '../db/schema.sql'),
  path.resolve(__dirname, '../../src/db/schema.sql'),
  path.resolve(process.cwd(), 'api/src/db/schema.sql'),
  path.resolve(process.cwd(), 'src/db/schema.sql'),
];

let schemaPath: string | undefined;
for (const possiblePath of candidateSchemaPaths) {
  if (fs.existsSync(possiblePath)) {
    schemaPath = possiblePath;
    break;
  }
}

if (!schemaPath) {
  logger.error(`[Migrate] Nao foi possivel localizar o arquivo schema.sql. Caminhos verificados: ${candidateSchemaPaths.join(', ')}`);
  process.exit(1);
}

async function migrate() {
  logger.info('[Migrate] Iniciando aplicacao do schema do banco de dados.');
  logger.info(`[Migrate] Utilizando schema localizado em: ${schemaPath}`);

  const client = await db.pool.connect();
  logger.info('[Migrate] Conectado ao banco de dados.');

  try {
    logger.info('[Migrate] Lendo o arquivo de schema...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

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
    logger.error({ err }, '[Migrate] Falha na migracao. Encerrando processo.');
    process.exit(1);
  });
