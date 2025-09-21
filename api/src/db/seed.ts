// Caminho: api/src/db/seed.ts
import '../config/envLoader'; // Garante que o ambiente correto seja carregado
import bcrypt from 'bcryptjs';
import db from './index';

// A lógica agora está dentro de uma função exportável
export async function seedDatabase() {
  const client = await db.pool.connect();
  console.log('🚀 Iniciando o processo de seeding...');

  try {
    await client.query('BEGIN');

    console.log('🧹 Limpando tabelas existentes...');
    await client.query('TRUNCATE TABLE solicitacoes_acesso, obitos_registros, estatisticas_diarias, supervisor_plantao, ocorrencia_destaque, obitos, ocorrencias, usuarios, obms, crbms RESTART IDENTITY CASCADE');
    console.log('✅ Tabelas limpas.');

    // 1. Inserir CRBMs
    const crbmResult = await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      RETURNING id, nome
    `);
    const crbmMap = new Map<string, number>(crbmResult.rows.map(r => [r.nome, r.id]));
    console.log('-> CRBMs inseridos.');

    // 2. Inserir OBMs (Cidades)
    const obmsPorCrbm = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí'],
      '3º CRBM': ['Anápolis', 'Pirenópolis'],
      // Adicione mais se necessário para os testes
    };
    for (const [crbmNome, obms] of Object.entries(obmsPorCrbm)) {
      const crbmId = crbmMap.get(crbmNome);
      for (const obmNome of obms) {
        await client.query("INSERT INTO obms (nome, crbm_id) VALUES ($1, $2)", [obmNome, crbmId]);
      }
    }
    console.log('-> OBMs inseridas.');

    // 3. Inserir Naturezas de Ocorrência
    const naturezasParaInserir = [
      { grupo: 'Resgate', subgrupo: 'Resgate', abreviacao: 'RESGATE' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTE DE TRÂNSITO', abreviacao: null },
    ];
    for (const nat of naturezasParaInserir) {
      await client.query("INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES ($1, $2, $3) ON CONFLICT (grupo, subgrupo) DO NOTHING", [nat.grupo, nat.subgrupo, nat.abreviacao]);
    }
    console.log('-> Naturezas inseridas.');

    // 4. Inserir Usuários
    const supervisorSalt = await bcrypt.genSalt(10);
    const supervisorSenhaHash = await bcrypt.hash('supervisor123', supervisorSalt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'user') ON CONFLICT (email) DO NOTHING",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', supervisorSenhaHash]
    );
    console.log('-> Usuário Supervisor inserido.');

    // 5. Inserir configurações padrão
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');

    await client.query('COMMIT');
    console.log('✅ Seeding concluído com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding:', error);
    throw error; // Lança o erro para que o processo que o chamou saiba que falhou
  } finally {
    client.release();
  }
}

// Se este arquivo for executado diretamente (ex: npm run seed:dev), ele roda a função.
// Se for importado (como no teste), ele apenas exporta a função.
if (require.main === module) {
  seedDatabase().finally(() => {
    console.log('🛑 Pool de conexões do seed encerrado.');
    db.pool.end();
  });
}
