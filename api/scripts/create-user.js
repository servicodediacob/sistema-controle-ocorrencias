// Create a user in the database via Prisma
// Usage: node api/scripts/create-user.js <email> <senha> [nome] [obm_id]

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const envFile = process.env.NODE_ENV === 'test'
  ? '.env.test'
  : process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const prisma = new PrismaClient();

async function main() {
  const [email, senha, nomeArg, obmIdArg] = process.argv.slice(2);
  if (!email || !senha) {
    console.error('Uso: node api/scripts/create-user.js <email> <senha> [nome] [obm_id]');
    process.exit(1);
  }
  const nome = nomeArg || email.split('@')[0];
  const obm_id = obmIdArg ? Number(obmIdArg) : null;

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    console.log(`[create-user] Usuário já existe: ${email}`);
    return;
  }
  const senha_hash = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({
    data: { nome, email, senha_hash, role: 'user', obm_id },
    select: { id: true, nome: true, email: true, role: true, obm_id: true },
  });
  console.log('[create-user] Criado:', user);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

