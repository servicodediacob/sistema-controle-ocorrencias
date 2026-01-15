// Caminho: api/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
import db from '../db';
import logger from '../config/logger';

// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Verificação de Segurança Rígida
//    O script agora se recusa a rodar se não estiver EXPLICITAMENTE em modo de teste.
if (process.env.NODE_ENV !== 'test') {
  logger.fatal('[Migrate] ERRO CRÍTICO DE SEGURANÇA: Este script é destrutivo e só pode ser executado em ambiente de teste (NODE_ENV=test). Abortando.');
  process.exit(1); // Encerra o processo com código de erro.
}
// ======================= FIM DA CORREÇÃO =======================

// A lógica de encontrar o schema continua a mesma, pois é usada pelos testes.
const candidateSchemaPaths: string[] = [
  path.resolve(__dirname, '../db/schema.sql'),
  path.resolve(__dirname, '../../src/db/schema.sql'),
  path.resolve(process.cwd(), 'api/src/db/schema.sql'),
  path.resolve(process.cwd(), 'src/db/schema.sql'),
  path.resolve(process.cwd(), 'db/schema.sql'),
];

let schemaPath: string;
try {
  schemaPath = (() => {
    for (const possiblePath of candidateSchemaPaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }
    const message = `[Migrate] Nao foi possivel localizar o arquivo schema.sql. Caminhos verificados: ${candidateSchemaPaths.join(', ')}`;
    throw new Error(message);
  })();
} catch (error) {
  logger.error({ err: error }, '[Migrate] Falha ao resolver caminho do schema.');
  process.exit(1);
}

async function migrate() {
  logger.info('[Migrate] Iniciando aplicacao do schema do banco de dados para TESTES.');
  logger.info(`[Migrate] Utilizando schema localizado em: ${schemaPath}`);

  const client = await db.pool.connect();
  logger.info('[Migrate] Conectado ao banco de dados de teste.');

  try {
    logger.info('[Migrate] Lendo o arquivo de schema...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    logger.info('[Migrate] Executando o script de schema completo (APENAS PARA TESTES).');
    await client.query(schemaSql);

    logger.info('[Migrate] Schema de teste aplicado com sucesso.');
  } catch (error) {
    logger.error({ err: error }, '[Migrate] Erro durante a aplicacao do schema de teste.');
    throw error;
  } finally {
    client.release();
    logger.info('[Migrate] Conexao com o banco de teste liberada.');
  }
}

migrate()
  .then(() => {
    logger.info('[Migrate] Migração de teste finalizada sem erros.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, '[Migrate] Falha na migração de teste. Encerrando processo.');
    process.exit(1);
  });
