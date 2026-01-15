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
  const date = process.argv[2];
  if (!date) {
    console.log('Uso: node api/scripts/inspect-ocorrencias-detalhadas.js YYYY-MM-DD');
    process.exit(1);
  }
  const d = new Date(date + 'T00:00:00Z');
  const list = await prisma.ocorrenciaDetalhada.findMany({
    where: { data_ocorrencia: d },
    include: { natureza: true, cidade: true },
    orderBy: { id: 'asc' }
  });
  console.log(`[detalhadas eq date] count=${list.length}`);
  for (const o of list) {
    console.log({id:o.id, numero:o.numero_ocorrencia, data:o.data_ocorrencia, hora:o.horario_ocorrencia, natureza:o.natureza?.subgrupo, cidade:o.cidade?.nome});
  }
  const start = new Date(date + 'T00:00:00Z');
  const end = new Date(date + 'T23:59:59.999Z');
  const range = await prisma.ocorrenciaDetalhada.findMany({
    where: { data_ocorrencia: { gte: start, lte: end } },
    include: { natureza: true, cidade: true },
    orderBy: { id: 'asc' }
  });
  console.log(`[detalhadas range] count=${range.length}`);
  for (const o of range) {
    console.log({id:o.id, numero:o.numero_ocorrencia, data:o.data_ocorrencia, hora:o.horario_ocorrencia, natureza:o.natureza?.subgrupo, cidade:o.cidade?.nome});
  }
}

main().finally(async ()=> prisma.$disconnect());

