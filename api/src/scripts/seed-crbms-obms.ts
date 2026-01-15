import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const crbmsToSeed = [
  {
    nome: '1º CRBM',
    obms: ['Goiânia - Diurno', 'Goiânia - Noturno'],
  },
  {
    nome: '2º CRBM',
    obms: [
      'Acreúna',
      'Chapadão do Céu',
      'Jataí',
      'Mineiros',
      'Palmeiras',
      'Quirinópolis',
      'Rio Verde',
      'Santa Helena',
    ],
  },
  {
    nome: '3º CRBM',
    obms: ['Anápolis', 'Ceres', 'Itapaci', 'Jaraguá', 'Pirenópolis', 'Silvânia'],
  },
  {
    nome: '4º CRBM',
    obms: [
      'Cristalina',
      'Luziânia',
      'Santo Antônio do Descoberto',
      'Valparaíso',
      'Águas Lindas',
    ],
  },
  {
    nome: '5º CRBM',
    obms: [
      'Aparecida de Goiânia - Diurno',
      'Aparecida de Goiânia - Noturno',
      'Bela Vista',
      'Goianira',
      'Inhumas',
      'Nerópolis',
      'Senador Canedo',
      'Trindade',
    ],
  },
  {
    nome: '6º CRBM',
    obms: ['Aruanã', 'Goiás', 'Iporá', 'Itaberaí', 'São Luiz'],
  },
  {
    nome: '7º CRBM',
    obms: [
      'Caldas',
      'Catalão',
      'Goiatuba',
      'Ipameri',
      'Itumbiara',
      'Morrinhos',
      'Pires do Rio',
    ],
  },
  {
    nome: '8º CRBM',
    obms: [
      'Goianésia',
      'Minaçu',
      'Niquelândia',
      'Porangatu',
      'São Miguel do Araguaia',
      'Uruaçu',
    ],
  },
  {
    nome: '9º CRBM',
    obms: ['Campos Belos', 'Formosa', 'Planaltina', 'Posse'],
  },
];

async function seedCrbmsAndObms() {
  console.log('Atualizando CRBMs e OBMs conforme o recorte solicitado...');
  for (const { nome, obms } of crbmsToSeed) {
    const crbm = await prisma.cRBM.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
    console.log(`  CRBM garantido: ${nome} (${crbm.id})`);

    for (const obmNome of obms) {
      const obm = await prisma.oBM.upsert({
        where: { nome: obmNome },
        update: { crbm_id: crbm.id },
        create: { nome: obmNome, crbm_id: crbm.id },
      });
      console.log(`    OBM atribuída: ${obm.nome} (${obm.id}) → ${nome}`);
    }
  }
}

seedCrbmsAndObms()
  .catch((err) => {
    console.error('Erro ao inserir CRBMs e OBMs:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
