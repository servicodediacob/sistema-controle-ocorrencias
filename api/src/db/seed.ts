import bcrypt from 'bcryptjs';
import db from './index';

async function seedDatabase() {
  const client = await db.pool.connect();
  console.log('🚀 Iniciando o processo de seeding (v5.0 - Lista completa de naturezas)...');

  try {
    await client.query('BEGIN');

    // Limpar tabelas para evitar duplicatas
    console.log('🧹 Limpando tabelas existentes...');
    await client.query('DELETE FROM supervisor_plantao');
    await client.query('DELETE FROM ocorrencia_destaque');
    await client.query('DELETE FROM obitos');
    await client.query('DELETE FROM ocorrencias');
    await client.query('DELETE FROM usuarios');
    await client.query('DELETE FROM cidades');
    await client.query('DELETE FROM crbms');
    await client.query('DELETE FROM naturezas_ocorrencia');
    console.log('✅ Tabelas existentes foram limpas.');

    // 1. Inserir CRBMs (sem alterações)
    console.log('Inserindo CRBMs...');
    const crbmResult = await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      RETURNING id, nome
    `);
    const crbmMap = new Map<string, number>(crbmResult.rows.map(r => [r.nome, r.id]));
    console.log('-> CRBMs inseridos.');

    // 2. Inserir Cidades (sem alterações)
    console.log('Inserindo Cidades...');
    const cidadesPorCrbm = {
      '1º CRBM': ['Goiânia Diurno', 'Goiânia Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí', 'Mineiros', 'Santa Helena', 'Palmeiras', 'Quirinópolis', 'Chapadão do Céu', 'Acreúna'],
      '3º CRBM': ['Anápolis', 'Pirenópolis', 'Ceres', 'Jaraguá', 'Silvânia', 'Itapaci'],
      '4º CRBM': ['Luziânia', 'Águas Lindas', 'Cristalina', 'Valparaíso', 'Santo Antônio do Descoberto'],
      '5º CRBM': ['Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno', 'Senador Canedo', 'Trindade', 'Inhumas', 'Goianira', 'Nerópolis', 'Bela Vista'],
      '6º CRBM': ['Goiás', 'Iporá', 'Itaberaí', 'São Luís', 'Aruanã'],
      '7º CRBM': ['Itumbiara', 'Caldas', 'Catalão', 'Morrinhos', 'Pires do Rio', 'Goiatuba', 'Ipameri'],
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

    // 3. Inserir Naturezas de Ocorrência (LISTA COMPLETA ADICIONADA AQUI)
    console.log('Inserindo Naturezas de Ocorrência...');
    const naturezasParaInserir = [
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTE DE TRÂNSITO' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'AFOGAMENTO OU CADÁVER' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ARMA DE FOGO/BRANCA/AGRESSÃO' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'AUTO EXTÉRMÍNIO' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'MAL SÚBITO' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTES COM VIATURAS' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'OUTROS' },
      // Adicione outras naturezas gerais aqui se necessário
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação' },
      { grupo: 'Atendimento Pré-Hospitalar', subgrupo: 'Clínico' },
      { grupo: 'Trânsito', subgrupo: 'Colisão Carro x Moto' }
    ];

    for (const nat of naturezasParaInserir) {
      await client.query("INSERT INTO naturezas_ocorrencia (grupo, subgrupo) VALUES ($1, $2) ON CONFLICT (grupo, subgrupo) DO NOTHING", [nat.grupo, nat.subgrupo]);
    }
    console.log('-> Naturezas de Ocorrência inseridas.');

    // 4. Inserir Usuário Supervisor (sem alterações)
    console.log('Inserindo Usuário Supervisor...');
    const senhaPlana = 'supervisor123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', senhaHash]
    );
    console.log('-> Usuário supervisor inserido.');

    // 5. Inserir configurações padrão (sem alterações)
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
