// api/scripts/create-admin.ts
// Cria ou promove um usuário para admin de forma idempotente.
// Funciona tanto em bases com coluna "email" quanto com "login",
// e atualiza opcionalmente a coluna "perfil" (se existir) e/ou "role".

import '../src/config/envLoader';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type ColumnInfo = { column_name: string };

async function detectColumns(schema = 'public') {
  const rows = await prisma.$queryRaw<ColumnInfo[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = 'usuarios'
  `;
  const cols = new Set(rows.map((r) => r.column_name));
  const emailCol = cols.has('email') ? 'email' : cols.has('login') ? 'login' : null;
  const perfilCol = cols.has('perfil') ? 'perfil' : null;
  const roleCol = cols.has('role') ? 'role' : null;
  if (!emailCol) {
    throw new Error("Tabela 'usuarios' não possui coluna 'email' nem 'login'.");
  }
  return { emailCol, perfilCol, roleCol } as const;
}

// Implementação principal está em run() abaixo.

async function run() {
  const schema = process.env.DB_SCHEMA || 'public';
  const email = process.env.ADMIN_EMAIL as string;
  const nome = (process.env.ADMIN_NOME as string) || 'Administrador';
  const senha = process.env.ADMIN_PASSWORD as string;
  const forceUpdate = String(process.env.FORCE_UPDATE || 'false').toLowerCase() === 'true';
  const obmIdEnv = process.env.ADMIN_OBM_ID;
  const obmId = obmIdEnv ? Number(obmIdEnv) : null;

  const { emailCol, perfilCol, roleCol } = await detectColumns(schema);

  const senhaHash = await bcrypt.hash(senha, 10);

  // Monta nomes qualificados
  const table = `${schema}.usuarios`;

  // 1) Verifica se existe
  const exists = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM ${table} WHERE ${emailCol} = $1 LIMIT 1`,
    email
  );

  if (exists.length === 0) {
    // 2) Criar
    const cols = [ 'nome', emailCol, 'senha_hash' ] as string[];
    const vals: any[] = [ nome, email, senhaHash ];
    if (perfilCol) { cols.push(perfilCol); vals.push('admin'); }
    if (roleCol) { cols.push(roleCol); vals.push('admin'); }
    if (obmId !== null && !Number.isNaN(obmId)) { cols.push('obm_id'); vals.push(obmId); }

    const placeholders = vals.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
    await prisma.$executeRawUnsafe(sql, ...vals);

    console.log('[create-admin] Usuário criado como admin:', email);
  } else {
    // 3) Atualizar
    const sets: string[] = [];
    const params: any[] = [];

    if (forceUpdate) {
      sets.push(`"senha_hash" = $${params.length+1}`); params.push(senhaHash);
    }
    if (perfilCol) { sets.push(`"${perfilCol}" = 'admin'`); }
    if (roleCol) { sets.push(`"${roleCol}" = 'admin'`); }
    if (obmId !== null && !Number.isNaN(obmId)) { sets.push(`"obm_id" = $${params.length+1}`); params.push(obmId); }

    if (sets.length === 0) {
      console.log('[create-admin] Usuário já existia e nenhuma alteração foi solicitada. Use FORCE_UPDATE=true para atualizar a senha.');
    } else {
      const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE ${emailCol} = $${params.length+1}`;
      await prisma.$executeRawUnsafe(sql, ...params, email);
      console.log('[create-admin] Usuário promovido/atualizado como admin:', email);
    }
  }
}

run()
  .catch((e) => {
    console.error('[create-admin] Erro:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
