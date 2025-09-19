// backend/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
import db from '../db';

// CORREÇÃO: Construir o caminho a partir do diretório de trabalho atual do processo.
// Isso garante que o caminho seja resolvido corretamente, independentemente de como o script é executado.
const SCHEMA_FILE_PATH = path.resolve(process.cwd(), 'src/db/schema.sql');

async function migrate() {
  console.log('🚀 Iniciando a migração do schema do banco de dados...');
  console.log(`🔍 Procurando schema em: ${SCHEMA_FILE_PATH}`); // Log de depuração

  const client = await db.pool.connect();
  console.log('✅ Conectado ao banco de dados.');

  try {
    console.log('📄 Lendo o arquivo de schema (schema.sql)...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');

    console.log('🔄 Executando o script de schema para (re)criar as tabelas...');
    await client.query(schemaSql);
    
    console.log('🎉 Schema do banco de dados aplicado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração do schema.');
    console.error(error);
  } finally {
    client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
    await db.pool.end();
    console.log('🛑 Pool de conexões encerrado.');
  }
}

migrate();
