// api/migrate-config.js

// Carrega as variáveis de ambiente corretas antes de qualquer outra coisa.
// Isso garante que a DATABASE_URL seja lida do ambiente correto (desenvolvimento ou produção).
require('./dist/config/envLoader');

const dbConfig = {
  // A biblioteca 'node-pg-migrate' usa a variável de ambiente DATABASE_URL por padrão
  // quando nenhuma outra configuração de conexão é fornecida.
  
  // Diretório onde os arquivos de migração estão localizados.
  dir: 'src/db/migrations',

  // Tabela que a biblioteca usará para controlar o histórico de migrações.
  migrationsTable: 'pgmigrations',

  // Informa à biblioteca que estamos usando o driver 'pg'.
  driver: 'pg',

  // Em produção (Render/Neon), o SSL é obrigatório e gerenciado pela string de conexão.
  // Em outros ambientes, pode ser desativado se não for necessário.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

module.exports = dbConfig;
