// Caminho: api/migrate-config.js

// Carrega as variáveis de ambiente corretas antes de qualquer outra coisa
require('./dist/config/envLoader');

const dbConfig = {
  // A biblioteca usa a variável de ambiente DATABASE_URL por padrão,
  // que já configuramos nos arquivos .env e no Render.
  // Não precisamos especificar usuário, senha, etc., aqui.
  
  // Diretório onde os arquivos de migração serão criados e lidos
  dir: 'src/db/migrations',

  // Tabela que a biblioteca usará para controlar quais migrações já foram executadas
  migrationsTable: 'pgmigrations',

  // Informa à biblioteca que estamos usando o driver 'pg'
  driver: 'pg',

  // Desativa a necessidade de um certificado SSL em ambientes de não produção
  // Em produção (Render/Neon), o SSL é gerenciado pela connection string.
  ssl: process.env.NODE_ENV === 'production',
};

module.exports = dbConfig;
