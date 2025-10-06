// Carrega as variáveis de ambiente corretas antes de qualquer outra coisa
// Isso garante que DATABASE_URL seja lido do arquivo .env apropriado
// quando rodamos localmente, e do ambiente do Render em produção.
require('./dist/config/envLoader');

const dbConfig = {
  // A biblioteca usará a variável de ambiente DATABASE_URL por padrão,
  // que já configuramos nos arquivos .env e no Render.
  // Não precisamos especificar usuário, senha, etc., diretamente aqui.
  
  // Diretório onde os arquivos de migração serão criados e lidos.
  // Corrigido para apontar para a pasta correta na raiz da 'api'.
  dir: 'migrations',

  // Tabela que a biblioteca usará para controlar quais migrações já foram executadas.
  migrationsTable: 'pgmigrations',

  // Informa à biblioteca que estamos usando o driver 'pg' (PostgreSQL).
  driver: 'pg',

  // Configuração de SSL.
  // Em produção (Render/Neon), o SSL é obrigatório e gerenciado pela connection string.
  // Em outros ambientes, é desativado para facilitar a conexão local.
  ssl: process.env.NODE_ENV === 'production',
};

module.exports = dbConfig;
