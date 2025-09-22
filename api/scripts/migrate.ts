import '../config/envLoader';
import fs from 'fs';
import path from 'path';
// CORREÇÃO: Usando o caminho absoluto a partir da pasta 'src'
import db from '@/db'; 

const SCHEMA_FILE_PATH = path.resolve(process.cwd(), 'src/db/schema.sql');

async function migrate() {
  console.log('🚀 Iniciando a migração do schema do banco de dados...');
  
  const client = await db.pool.connect();
  console.log('✅ Conectado ao banco de dados.');

  try {
    console.log(`📄 Lendo o arquivo de schema de: ${SCHEMA_FILE_PATH}`);
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
