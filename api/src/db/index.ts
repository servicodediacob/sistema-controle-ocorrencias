// Caminho: api/src/db/index.ts

import { Pool, PoolConfig } from 'pg';
import 'dotenv/config';
import logger from '../config/logger'; // Importa nosso logger

// 1. Validação da Variável de Ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.fatal('FATAL ERROR: A variável de ambiente DATABASE_URL não está definida.');
  process.exit(1); // Encerra a aplicação se a URL do banco não existir
}

// 2. Determina se estamos em ambiente de produção de forma mais segura
const isProduction = databaseUrl.includes('neon.tech');

// 3. Monta o objeto de configuração da conexão
const connectionConfig: PoolConfig = {
  connectionString: databaseUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

// 4. Log de diagnóstico aprimorado
logger.info(
  {
    production_mode: isProduction,
    ssl_enabled: connectionConfig.ssl !== false,
    // Não logamos a string de conexão inteira por segurança
    db_host: new URL(databaseUrl).hostname, 
  },
  '[DIAGNÓSTICO DB] Configurando pool de conexão com o banco de dados.'
);

// 5. Cria o pool com a configuração correta
const pool = new Pool(connectionConfig);

// Adiciona um listener para erros no pool, para que possamos logá-los
pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no cliente do pool de banco de dados');
});

// 6. Exporta o pool e uma função query para uso no restante da aplicação
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool: pool,
};
