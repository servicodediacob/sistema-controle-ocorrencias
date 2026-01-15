// api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados com dados oficiais...');

  // Mapeamento de CRBMs e OBMs
  const obmsPorCrbm: Record<string, string[]> = {
    '1º CRBM': ['GOIÂNIA - DIURNO', 'GOIÂNIA - NOTURNO'],
    '2º CRBM': ['RIO VERDE', 'JATAI', 'MINEIROS', 'SANTA HELENA', 'PALMEIRAS', 'QUIRINÓPOLIS', 'CHAPADÃO DO CÉU', 'ACREUNA'],
    '3º CRBM': ['ANÁPOLIS', 'PIRENÓPOLIS', 'CERES', 'JARAGUÁ', 'SILVÂNIA', 'ITAPACI'],
    '4º CRBM': ['LUZIANIA', 'ÁGUAS LINDAS', 'CRISTALINA', 'VALPARAÍSO', 'SANTO ANTONIO DO DESCOBERTO'],
    '5º CRBM': ['APARECIDA DE GOIANIA - DIURNO', 'APARECIDA DE GOIANIA - NOTURNO', 'SENADOR CANEDO', 'TRINDADE', 'INHUMAS', 'GOIANIRA', 'NERÓPOLIS', 'BELA VISTA'],
    '6º CRBM': ['GOIAS', 'IPORÁ', 'ITABERAÍ', 'SÃO LUIS', 'ARUANÃ'],
    '7º CRBM': ['ITUMBIARA', 'CALDAS', 'CATALÃO', 'MORRINHOS', 'PIRES DO RIO', 'GOIATUBA', 'IPAMERI'],
    '8º CRBM': ['PORANGATÚ', 'GOIANÉSIA', 'MINAÇU', 'NIQUELÂNDIA', 'URUAÇU', 'SÃO MIGUEL DO ARAGUAIA'],
    '9º CRBM': ['FORMOSA', 'PLANALTINA', 'POSSE', 'CAMPOS BELOS'],
  };

  // Lista de naturezas operacionais
  const naturezasOperacionais = [
    { grupo: 'Resgate', subgrupo: 'Resgate - Salvamento em Emergências' },
    { grupo: 'Incêndio', subgrupo: 'Vegetação' },
    { grupo: 'Incêndio', subgrupo: 'Edificações' },
    { grupo: 'Incêndio', subgrupo: 'Outros' },
    { grupo: 'Busca e Salvamento', subgrupo: 'Cadáver' },
    { grupo: 'Busca e Salvamento', subgrupo: 'Diversos' },
    { grupo: 'Ações Preventivas', subgrupo: 'Palestras' },
    { grupo: 'Ações Preventivas', subgrupo: 'Eventos' },
    { grupo: 'Ações Preventivas', subgrupo: 'Folders/Panfletos' },
    { grupo: 'Ações Preventivas', subgrupo: 'Outros' },
    { grupo: 'Atividades Técnicas', subgrupo: 'Inspeções' },
    { grupo: 'Atividades Técnicas', subgrupo: 'Análise de Projetos' },
    { grupo: 'Produtos Perigosos', subgrupo: 'Vazamentos' },
    { grupo: 'Produtos Perigosos', subgrupo: 'Outros / Diversos' },
    { grupo: 'Defesa Civil', subgrupo: 'Preventiva' },
    { grupo: 'Defesa Civil', subgrupo: 'De Resposta' },
  ];

  // ======================= INÍCIO DA CORREÇÃO =======================
  // 1. Definição da lista de naturezas para o relatório de óbitos
  const naturezasObitos = [
    { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTE DE TRÂNSITO' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'AFOGAMENTO OU CADÁVER' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'ARMA DE FOGO/BRANCA/AGRESSÃO' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'AUTO EXTERMÍNIO' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'MAL SÚBITO' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTES COM VIATURAS' },
    { grupo: 'Relatório de Óbitos', subgrupo: 'OUTROS' },
  ];
  // ======================= FIM DA CORREÇÃO =======================

  await prisma.$transaction(async (tx) => {
    console.log('Limpando dados antigos de apoio...');
    await tx.oBM.deleteMany({});
    await tx.cRBM.deleteMany({});
    await tx.naturezaOcorrencia.deleteMany({});
    console.log('Tabelas de OBM, CRBM e Naturezas limpas.');

    // Criar CRBMs
    console.log('Inserindo CRBMs...');
    await tx.cRBM.createMany({
      data: Object.keys(obmsPorCrbm).map(nome => ({ nome })),
      skipDuplicates: true,
    });
    console.log('CRBMs inseridos.');

    // Criar OBMs
    console.log('Inserindo OBMs...');
    for (const [nomeCrbm, listaObms] of Object.entries(obmsPorCrbm)) {
      const crbm = await tx.cRBM.findUnique({ where: { nome: nomeCrbm } });
      if (crbm) {
        await tx.oBM.createMany({
          data: listaObms.map(nomeObm => ({ nome: nomeObm, crbm_id: crbm.id })),
          skipDuplicates: true,
        });
      }
    }
    console.log('OBMs inseridas.');

    // ======================= INÍCIO DA CORREÇÃO =======================
    // 2. Inserir TODAS as naturezas (operacionais e de óbitos)
    console.log('Inserindo Naturezas de Ocorrência...');
    await tx.naturezaOcorrencia.createMany({
      data: [...naturezasOperacionais, ...naturezasObitos], // Combina as duas listas
      skipDuplicates: true,
    });
    console.log('Todas as Naturezas de Ocorrência foram inseridas.');
    // ======================= FIM DA CORREÇÃO =======================
  });

  // Manter a criação do usuário administrador
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@exemplo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'senhaforte123';
  
  const adminExists = await prisma.usuario.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    console.log(`Criando usuário administrador padrão: ${adminEmail}`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    const obmAdmin = await prisma.oBM.findFirst({ where: { nome: 'GOIÂNIA - DIURNO' } });

    await prisma.usuario.create({
      data: {
        nome: 'Administrador do Sistema',
        email: adminEmail,
        senha_hash: hashedPassword,
        role: 'admin',
        obm_id: obmAdmin?.id,
      },
    });
    console.log('Usuário administrador criado.');
  } else {
    console.log(`Usuário administrador (${adminEmail}) já existe.`);
  }

  console.log('Seeding concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
