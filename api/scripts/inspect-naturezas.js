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
  const list = await prisma.naturezaOcorrencia.findMany({ orderBy: [{ grupo: 'asc' }, { subgrupo: 'asc' }] });
  console.log(`[naturezas] total=${list.length}`);
  for (const n of list) {
    console.log(`${n.id} | ${n.grupo} | ${n.subgrupo} | ${n.abreviacao || ''}`);
  }
}

main().finally(async () => prisma.$disconnect());

