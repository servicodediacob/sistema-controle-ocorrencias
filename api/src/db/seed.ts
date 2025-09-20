// Caminho: backend/src/db/seed.ts

import bcrypt from 'bcryptjs';
import db from './index';

async function seedDatabase() {
  const client = await db.pool.connect();
  console.log('🚀 Iniciando o processo de seeding (v6.0 - Lista completa de naturezas com abreviações)...');

  try {
    await client.query('BEGIN');

    // Limpar tabelas
    console.log('🧹 Limpando tabelas existentes...');
    await client.query('TRUNCATE TABLE obitos_registros, estatisticas_diarias, supervisor_plantao, ocorrencia_destaque, obitos, ocorrencias, usuarios, cidades, crbms, naturezas_ocorrencia RESTART IDENTITY CASCADE');
    console.log('✅ Tabelas limpas e sequências reiniciadas.');

    // 1. Inserir CRBMs
    console.log('Inserindo CRBMs...');
    const crbmResult = await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      RETURNING id, nome
    `);
    const crbmMap = new Map<string, number>(crbmResult.rows.map(r => [r.nome, r.id]));
    console.log('-> CRBMs inseridos.');

    // 2. Inserir Cidades
    console.log('Inserindo Cidades...');
    const cidadesPorCrbm = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí', 'Mineiros', 'Santa Helena', 'Palmeiras', 'Quirinópolis', 'Chapadão do Céu', 'Acreuna'],
      '3º CRBM': ['Anápolis', 'Pirenópolis', 'Ceres', 'Jaraguá', 'Silvânia', 'Itapaci'],
      '4º CRBM': ['Luziânia', 'Águas Lindas', 'Cristalina', 'Valparaíso', 'Santo Antônio do Descoberto'],
      '5º CRBM': ['Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno', 'Senador Canedo', 'Trindade', 'Inhumas', 'Goianira', 'Nerópolis', 'Bela Vista'],
      '6º CRBM': ['Goiás', 'Iporá', 'Itaberaí', 'São Luís', 'Aruanã'],
      '7º CRBM': ['Itumbiara', 'Caldas Novas', 'Catalão', 'Morrinhos', 'Pires do Rio', 'Goiatuba', 'Ipameri'],
      '8º CRBM': ['Porangatu', 'Goianésia', 'Minaçu', 'Niquelândia', 'Uruaçu', 'São Miguel do Araguaia'],
      '9º CRBM': ['Formosa', 'Planaltina', 'Posse', 'Campos Belos'],
    };
    for (const [crbmNome, cidades] of Object.entries(cidadesPorCrbm)) {
      const crbmId = crbmMap.get(crbmNome);
      for (const cidadeNome of cidades) {
        await client.query("INSERT INTO cidades (nome, crbm_id) VALUES ($1, $2)", [cidadeNome, crbmId]);
      }
    }
    console.log('-> Cidades inseridas.');

    // 3. Inserir Naturezas de Ocorrência com Abreviações
    console.log('Inserindo Naturezas de Ocorrência...');
    const naturezasParaInserir = [
      // Resgate
      { grupo: 'Resgate', subgrupo: 'Resgate', abreviacao: 'RESGATE' },
      // Incêndio
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio - Outros', abreviacao: 'INC. OUT.' },
      // Busca e Salvamento
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca e Salvamento - Diversos', abreviacao: 'B. SALV.' },
      // Ações Preventivas
      { grupo: 'Ações Preventivas', subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
      { grupo: 'Ações Preventivas', subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
      { grupo: 'Ações Preventivas', subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
      { grupo: 'Ações Preventivas', subgrupo: 'Outros', abreviacao: 'AP. OUT' },
      // Atividades Técnicas
      { grupo: 'Atividades Técnicas', subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
      // Produtos Perigosos
      { grupo: 'Produtos Perigosos', subgrupo: 'Vazamentos', abreviacao: 'PPV' },
      { grupo: 'Produtos Perigosos', subgrupo: 'Outros / Diversos', abreviacao: 'PPO' },
      // Defesa Civil
      { grupo: 'Defesa Civil', subgrupo: 'Preventiva', abreviacao: 'DC PREV.' },
      { grupo: 'Defesa Civil', subgrupo: 'De Resposta', abreviacao: 'DC RESP.' },
      // Relatório de Óbitos (sem abreviação visível na tabela principal)
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTE DE TRÂNSITO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'AFOGAMENTO OU CADÁVER', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ARMA DE FOGO/BRANCA/AGRESSÃO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'AUTO EXTÉRMÍNIO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'MAL SÚBITO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTES COM VIATURAS', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'OUTROS', abreviacao: null },
    ];

    for (const nat of naturezasParaInserir) {
      await client.query("INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES ($1, $2, $3) ON CONFLICT (grupo, subgrupo) DO NOTHING", [nat.grupo, nat.subgrupo, nat.abreviacao]);
    }
    console.log('-> Naturezas de Ocorrência inseridas.');

    // 4. Inserir Usuário Supervisor
    console.log('Inserindo Usuário Supervisor...');
    const senhaPlana = 'supervisor123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', senhaHash]
    );
    console.log('-> Usuário supervisor inserido.');

    // 5. Inserir configurações padrão
    console.log('Inicializando tabelas de gestão...');
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    console.log('-> Tabelas de gestão inicializadas.');

    await client.query('COMMIT');
    console.log('✅ Seeding concluído com sucesso! Transação efetivada.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding (transação revertida):', error);
  } finally {
    client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
    await db.pool.end();
    console.log('🛑 Pool de conexões encerrado.');
  }
}

seedDatabase();
