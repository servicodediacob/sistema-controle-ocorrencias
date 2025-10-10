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
  const dateArg = process.argv[2];
  if (!dateArg) {
    console.log('Uso: node api/scripts/inspect-estatisticas.js YYYY-MM-DD');
    process.exit(1);
  }
  const d = new Date(dateArg);
  if (isNaN(d.getTime())) {
    console.error('Data inválida');
    process.exit(1);
  }
  const stats = await prisma.estatisticaDiaria.findMany({
    where: { data_registro: d },
    include: { natureza: true, obm: true },
    orderBy: { obm_id: 'asc' }
  });
  console.log(`[estatisticas] total=${stats.length}`);
  for (const s of stats) {
    console.log({ id: s.id, data: s.data_registro.toISOString().slice(0,10), obm: s.obm?.nome, natureza: s.natureza?.subgrupo, quantidade: s.quantidade });
  }
}

main().finally(async () => prisma.$disconnect());

