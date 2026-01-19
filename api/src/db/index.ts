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

// Em produção/Supabase, o cert pode ser self-signed via pooler.
// Forçamos ssl com rejectUnauthorized=false se:
// - NODE_ENV=production, ou
// - DATABASE_URL tem sslmode=require/verify-full, ou
// - FORÇA explicitamente via FORCE_DB_SSL=true
// Função para remover parâmetros de SSL da string de conexão
const getCleanConnectionString = (url: string | undefined) => {
  if (!url) return undefined;
  // Remove sslmode e outros parâmetros que podem conflitar
  return url.replace(/[?&]sslmode=[^&]+/, '').replace(/[?&]sslcert=[^&]+/, '');
};

const cleanConnectionString = getCleanConnectionString(connectionString);

const sslRequired =
  process.env.FORCE_DB_SSL === 'true' ||
  (connectionString && connectionString.includes('sslmode=')) ||
  process.env.NODE_ENV === 'production';

const config: PoolConfig = {
  connectionString: cleanConnectionString, // Usamos a string limpa
  ssl: sslRequired ? { rejectUnauthorized: false } : false,
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

// DESABILITADO: Não funciona com PgBouncer Transaction Mode
// A tabela já foi criada via Prisma migrations do SQL Editor
// Garante a existência da tabela de auditoria em ambientes de desenvolvimento
// para evitar erro 42P01 (relation does not exist) quando o banco está limpo.
// (async () => {
//   try {
//     const createSQL = `
//       CREATE TABLE IF NOT EXISTS auditoria_logs (
//         id SERIAL PRIMARY KEY,
//         usuario_id INTEGER,
//         usuario_nome VARCHAR(100),
//         acao VARCHAR(120) NOT NULL,
//         detalhes JSONB DEFAULT '{}'::jsonb,
//         criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
//       );
//     `;
//     await pool.query(createSQL);
//     logger.info('[DB] auditoria_logs verificada/criada.');
//   } catch (err) {
//     logger.warn({ err }, '[DB] Falha ao garantir a tabela auditoria_logs.');
//   }
// })();
