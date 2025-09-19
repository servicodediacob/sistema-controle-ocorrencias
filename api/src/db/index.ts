// backend/src/db/index.ts

import { Pool, PoolConfig } from 'pg';
import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas

// 1. Determina se estamos em ambiente de produção
const isProduction = process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech'));

// 2. Monta o objeto de configuração da conexão de forma explícita
const connectionConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // 3. Adiciona a configuração SSL APENAS se estiver em produção
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

// 4. LOG DE DIAGNÓSTICO: Verifica a URL de conexão que está sendo usada
console.log(`[DIAGNÓSTICO DB] Conectando ao banco de dados. Produção: ${isProduction}. SSL: ${connectionConfig.ssl !== false}.`);
// console.log(`[DIAGNÓSTICO DB] ConnectionString: ${process.env.DATABASE_URL}`); // <-- MELHORIA: Descomente esta linha se precisar depurar a URL

// 5. Cria o pool com a configuração correta
const pool = new Pool(connectionConfig);

// 6. Exporta o pool e uma função query para uso no restante da aplicação
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool: pool,
};
