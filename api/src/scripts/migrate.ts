import fs from 'fs';
import path from 'path';
// A importação com alias funciona aqui porque o 'tsc-alias' a corrige durante o build.
import db from '@/db'; 

// O script compilado estará em 'dist/scripts/'. O schema estará em 'dist/db/'.
// O caminho relativo de um para o outro é '../db/schema.sql'.
const SCHEMA_FILE_PATH = path.join(__dirname, '../db/schema.sql');

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
    throw error;
  } finally {
    client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
    await db.pool.end();
    console.log('🛑 Pool de conexões do processo de migração encerrado.');
  }
}

migrate().catch((err) => {
  console.error("A migração falhou. O processo de build será encerrado.", err);
  process.exit(1);
});
