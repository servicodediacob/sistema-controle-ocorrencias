// Quick script to inspect users in the database
// Usage: node api/scripts/inspect-users.js [email]

const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load env from api/.env.development (or respect NODE_ENV variants if present)
const envFile = process.env.NODE_ENV === 'test'
  ? '.env.test'
  : process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (email) {
    const user = await prisma.usuario.findUnique({ where: { email }, include: { obm: true } });
    if (!user) {
      console.log(`[users] Not found: ${email}`);
    } else {
      const { id, nome, email: e, role, obm_id } = user;
      console.log({ id, nome, email: e, role, obm_id, has_password_hash: Boolean(user.senha_hash) });
    }
  } else {
    const users = await prisma.usuario.findMany({ select: { id: true, nome: true, email: true, role: true } });
    console.log(`[users] total=${users.length}`);
    for (const u of users) console.log(u);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

