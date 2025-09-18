import bcrypt from 'bcryptjs';
import db from './index';

async function seedDatabase() {
  const client = await db.pool.connect();
  console.log('🚀 Iniciando o processo de seeding (v4.0 - Dados Reais)...');

  try {
    await client.query('BEGIN');

    // Limpar tabelas
    console.log('🧹 Limpando tabelas existentes...');
    await client.query('DELETE FROM supervisor_plantao');
    await client.query('DELETE FROM ocorrencia_destaque');
    await client.query('DELETE FROM obitos');
    await client.query('DELETE FROM ocorrencias');
    await client.query('DELETE FROM usuarios');
    await client.query('DELETE FROM obms CASCADE');
    await client.query('DELETE FROM cidades');
    await client.query('DELETE FROM crbms');
    await client.query('DELETE FROM naturezas_ocorrencia');
    console.log('✅ Tabelas existentes foram limpas.');

    // 1. Inserir todos os 9 CRBMs
    console.log('Inserting all 9 CRBMs...');
    const crbmIds: number[] = [];
    for (let i = 1; i <= 9; i++) {
      const crbmName = `${i}º CRBM`;
      const result = await client.query("INSERT INTO crbms (nome) VALUES ($1) RETURNING id", [crbmName]);
      crbmIds.push(result.rows[0].id);
    }
    console.log('-> 9 CRBMs inseridos.');

    // 2. Inserir Cidades Reais
    console.log('Inserting Cidades...');
    const cidadesPorCrbm = {
      // crbmIds[0] é o 1º CRBM, crbmIds[1] é o 2º, e assim por diante.
      1: ['Goiânia Diurno', 'Goiânia Noturno'], // Adicionando o 1º CRBM que faltava
      2: ['Rio Verde', 'Jataí', 'Mineiros', 'Santa Helena', 'Palmeiras', 'Quirinópolis', 'Chapadão do Céu', 'Acreúna'],
      3: ['Anápolis', 'Pirenópolis', 'Ceres', 'Jaraguá', 'Silvânia', 'Itapaci'],
      4: ['Luziânia', 'Águas Lindas', 'Cristalina', 'Valparaíso', 'Santo Antônio do Descoberto'],
      5: ['Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno', 'Senador Canedo', 'Trindade', 'Inhumas', 'Goianira', 'Nerópolis', 'Bela Vista'],
      6: ['Goiás', 'Iporá', 'Itaberaí', 'São Luís', 'Aruanã'],
      7: ['Itumbiara', 'Caldas', 'Catalão', 'Morrinhos', 'Pires do Rio', 'Goiatuba', 'Ipameri'],
      8: ['Porangatu', 'Goianésia', 'Minaçu', 'Niquelândia', 'Uruaçu', 'São Miguel do Araguaia'],
      9: ['Formosa', 'Planaltina', 'Posse', 'Campos Belos'],
    };

    for (const [crbmNum, cidades] of Object.entries(cidadesPorCrbm)) {
      const crbmId = crbmIds[parseInt(crbmNum) - 1];
      for (const cidadeNome of cidades) {
        await client.query("INSERT INTO cidades (nome, crbm_id) VALUES ($1, $2)", [cidadeNome, crbmId]);
      }
    }
    console.log('-> Todas as cidades foram inseridas e associadas aos seus CRBMs.');

    // 3. Inserir Naturezas de Ocorrência
    console.log('Inserting Naturezas de Ocorrência...');
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Incêndio em Vegetação')");
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Atendimento Pré-Hospitalar')");
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Acidente de Trânsito')");
    console.log('-> Naturezas de Ocorrência inseridas.');

    // 4. Inserir Usuário Supervisor
    console.log('Inserting Usuário Supervisor...');
    const senhaPlana = 'supervisor123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', senhaHash]
    );
    console.log('-> Usuário supervisor inserido.');

    // 5. Inserir configurações padrão
    console.log('Initializing management tables...');
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
