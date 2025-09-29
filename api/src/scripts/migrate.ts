// Caminho: api/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
// Caminhos relativos a partir de 'src/scripts/'
import db from '../db'; 
import logger from '../config/logger';

// O script compilado estará em 'dist/scripts/'. O schema estará em 'dist/db/'.
// O caminho relativo de um para o outro é '../db/schema.sql'.
// Usar path.join com __dirname torna o caminho absoluto e à prova de erros.
const SCHEMA_FILE_PATH = path.join(__dirname, '../db/schema.sql');

async function migrate() {
  logger.info('🚀 Iniciando a migração do schema do banco de dados...');
  logger.info(`🔍 Procurando schema em: ${SCHEMA_FILE_PATH}`);

  const client = await db.pool.connect();
  logger.info('✅ Conectado ao banco de dados.');

  try {
    logger.info('📄 Lendo o arquivo de schema (schema.sql)...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');

    logger.info('🔄 Executando o script para criar/atualizar as tabelas...');
    await client.query(schemaSql);
    
    logger.info('🎉 Schema do banco de dados aplicado com sucesso!');

  } catch (error) {
    logger.error({ err: error }, '❌ Erro durante a migração do schema:');
    throw error;
  } finally {
    client.release();
    logger.info('🔌 Conexão com o banco de dados liberada.');
  }
}

migrate()
  .then(() => {
    logger.info('Migração concluída. O processo será encerrado.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error("A migração falhou. O processo de build será encerrado.", err);
    process.exit(1);
  });
