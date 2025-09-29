import { Pool, PoolConfig } from 'pg';
import '../config/envLoader'; // Garante que as variáveis de ambiente sejam carregadas primeiro
import logger from '../config/logger';

// 1. Validação da Variável de Ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.fatal('ERRO FATAL: A variável de ambiente DATABASE_URL não está definida.');
  process.exit(1); // Encerra a aplicação se a URL do banco não existir
}

// 2. Determina se estamos em produção de forma mais segura
const isProduction = process.env.NODE_ENV === 'production';

// 3. Monta o objeto de configuração da conexão
const connectionConfig: PoolConfig = {
  connectionString: databaseUrl,
  // Adiciona configuração SSL apenas em produção
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

// 4. Log de diagnóstico aprimorado
logger.info(
  {
    production_mode: isProduction,
    ssl_enabled: connectionConfig.ssl !== false,
    db_host: new URL(databaseUrl).hostname, 
  },
  '[DB] Configurando pool de conexão.'
);

// 5. Cria o pool com a configuração correta
const pool = new Pool(connectionConfig);

// Adiciona um listener para erros no pool
pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no cliente do pool de banco de dados');
});

// 6. Exporta o pool e uma função query para uso no restante da aplicação
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool: pool,
};
