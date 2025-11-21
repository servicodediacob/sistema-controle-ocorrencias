// api/src/db/index.ts
import { Pool, PoolConfig } from 'pg';
import logger from '../config/logger';

// Garante que as variáveis de ambiente sejam carregadas antes do pool
import '../config/envLoader';

// Usa explicitamente a connectionString para evitar problemas quando
// o processo é iniciado fora do diretório api/.
const connectionString =
  process.env.DATABASE_POOL_URL ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  logger.error(
    '[DB] Nenhuma URL de banco definida. Configure DATABASE_POOL_URL, DATABASE_URL ou DIRECT_DATABASE_URL.'
  );
}

const config: PoolConfig = {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

pool.on('connect', () => {
  logger.info('Nova conexão com o banco de dados estabelecida pelo pool.');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no cliente do pool de banco de dados.');
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

// Garante a existência da tabela de auditoria em ambientes de desenvolvimento
// para evitar erro 42P01 (relation does not exist) quando o banco está limpo.
(async () => {
  try {
    const createSQL = `
      CREATE TABLE IF NOT EXISTS auditoria_logs (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        usuario_nome VARCHAR(100),
        acao VARCHAR(120) NOT NULL,
        detalhes JSONB DEFAULT '{}'::jsonb,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await pool.query(createSQL);
    logger.info('[DB] auditoria_logs verificada/criada.');
  } catch (err) {
    logger.warn({ err }, '[DB] Falha ao garantir a tabela auditoria_logs.');
  }
})();
