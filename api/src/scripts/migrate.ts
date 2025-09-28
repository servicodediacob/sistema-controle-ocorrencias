// api/src/scripts/migrate.ts

import fs from 'fs';
import path from 'path';
import db from '@/db'; // CORREÇÃO: Usando o alias padrão

const SCHEMA_FILE_PATH = path.resolve(process.cwd(), 'src/db/schema.sql');

async function migrate() {
  console.log('🚀 Iniciando a migração do schema do banco de dados...');
  console.log(`🔍 Procurando schema em: ${SCHEMA_FILE_PATH}`);

  const client = await db.pool.connect();
  console.log('✅ Conectado ao banco de dados.');

  try {
    console.log('📄 Lendo o arquivo de schema (schema.sql)...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');

    console.log('🔄 Executando o script para criar/atualizar as tabelas...');
    await client.query(schemaSql);
    
    console.log('🎉 Schema do banco de dados aplicado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração do schema:', error);
  } finally {
    client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
    await db.pool.end();
    console.log('🛑 Pool de conexões do processo de migração encerrado.');
  }
}

migrate();
