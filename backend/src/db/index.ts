import { Pool, PoolConfig } from 'pg';
import 'dotenv/config';

// 1. Determina se estamos em ambiente de produção
const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

// 2. Monta o objeto de configuração da conexão, tipando-o com PoolConfig
const connectionConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // 3. Adiciona a configuração SSL APENAS se estiver em produção
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

// 4. Cria o pool com a configuração correta
const pool = new Pool(connectionConfig);

// 5. Exporta o pool e uma função query para uso no restante da aplicação
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool: pool,
};
