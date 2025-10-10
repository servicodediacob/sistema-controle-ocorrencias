const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development')) });

const prisma = new PrismaClient();

async function main() {
  const obms = await prisma.oBM.findMany({ select: { id: true, nome: true } });
  console.log(`[obms] total=${obms.length}`);
  for (const o of obms) console.log(o);
}

main().finally(async () => prisma.$disconnect());

