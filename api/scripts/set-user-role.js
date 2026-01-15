// Update a user's role (admin|user) by email
// Usage: node api/scripts/set-user-role.js <email> <role>

const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

const envFile = process.env.NODE_ENV === 'test'
  ? '.env.test'
  : process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const prisma = new PrismaClient();

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !role || !['admin', 'user'].includes(role)) {
    console.error('Uso: node api/scripts/set-user-role.js <email> <admin|user>');
    process.exit(1);
  }
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) {
    console.error(`[set-role] Usuário não encontrado: ${email}`);
    process.exit(1);
  }
  const updated = await prisma.usuario.update({ where: { email }, data: { role } });
  console.log('[set-role] Atualizado:', { id: updated.id, email: updated.email, role: updated.role });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

