// Caminho: api/src/db/seed.ts

import '../config/envLoader'; // Garante que o ambiente correto seja carregado
import bcrypt from 'bcryptjs';
import db from './index';

/**
 * Função principal para semear o banco de dados.
 * Limpa todas as tabelas e insere um conjunto de dados iniciais para teste e desenvolvimento.
 */
export async function seedDatabase() {
  const client = await db.pool.connect();
  console.log('🚀 Iniciando o processo de seeding...');

  try {
    await client.query('BEGIN');

    console.log('🧹 Limpando tabelas existentes...');
    // A ordem TRUNCATE não importa aqui por causa do RESTART IDENTITY CASCADE
    await client.query('TRUNCATE TABLE solicitacoes_acesso, obitos_registros, estatisticas_diarias, supervisor_plantao, ocorrencia_destaque, obitos, ocorrencias, usuarios, obms, crbms RESTART IDENTITY CASCADE');
    console.log('✅ Tabelas limpas.');

    // 1. Inserir CRBMs (Comandos Regionais)
    const crbmResult = await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      RETURNING id, nome
    `);
    const crbmMap = new Map<string, number>(crbmResult.rows.map(r => [r.nome, r.id]));
    console.log('-> CRBMs inseridos.');

    // 2. Inserir OBMs (Unidades/Cidades)
    const obmsPorCrbm = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí'],
      '3º CRBM': ['Anápolis', 'Pirenópolis'],
      // Adicione mais OBMs para outros CRBMs se necessário para testes futuros
    };
    for (const [crbmNome, obms] of Object.entries(obmsPorCrbm)) {
      const crbmId = crbmMap.get(crbmNome);
      if (crbmId) {
        for (const obmNome of obms) {
          await client.query("INSERT INTO obms (nome, crbm_id) VALUES ($1, $2)", [obmNome, crbmId]);
        }
      }
    }
    console.log('-> OBMs inseridas.');

    // 3. Inserir Naturezas de Ocorrência
    const naturezasParaInserir = [
      { grupo: 'Resgate', subgrupo: 'Resgate', abreviacao: 'RESGATE' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio - Outros', abreviacao: 'INC. OUT.' },
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca e Salvamento - Diversos', abreviacao: 'B. SALV.' },
      { grupo: 'Atividades Preventivas', subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
      { grupo: 'Atividades Preventivas', subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
      { grupo: 'Atividades Preventivas', subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
      { grupo: 'Atividades Preventivas', subgrupo: 'Outros', abreviacao: 'AP. OUT' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
      { grupo: 'Produtos Perigosos', subgrupo: 'Vazamentos', abreviacao: 'PPV' },
      { grupo: 'Produtos Perigosos', subgrupo: 'Outros / Diversos', abreviacao: 'PPO' },
      { grupo: 'Defesa Civil', subgrupo: 'Preventiva', abreviacao: 'DC PREV.' },
      { grupo: 'Defesa Civil', subgrupo: 'De Resposta', abreviacao: 'DC RESP.' },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTE DE TRÂNSITO', abreviacao: null },
    ];
    for (const nat of naturezasParaInserir) {
      await client.query("INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES ($1, $2, $3) ON CONFLICT (grupo, subgrupo) DO NOTHING", [nat.grupo, nat.subgrupo, nat.abreviacao]);
    }
    console.log('-> Naturezas inseridas.');

    // 4. Inserir Usuários de Teste
    console.log('-> Inserindo usuários de teste...');
    
    // Usuário 'user' para testes de integração e CRUD básico
    const supervisorSalt = await bcrypt.genSalt(10);
    const supervisorSenhaHash = await bcrypt.hash('supervisor123', supervisorSalt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'user') ON CONFLICT (email) DO NOTHING",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', supervisorSenhaHash]
    );

    // Usuário 'admin' para testes E2E e de gerenciamento
    const adminSalt = await bcrypt.genSalt(10);
    const adminSenhaHash = await bcrypt.hash('admin123', adminSalt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING",
      ['Administrador de Teste', 'admin@cbm.pe.gov.br', adminSenhaHash]
    );
    console.log('-> Usuários Supervisor e Admin inseridos.');

    // 5. Inserir configurações padrão (tabelas de singleton)
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    console.log('-> Configurações padrão inseridas.');

    await client.query('COMMIT');
    console.log('✅ Seeding concluído com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding (transação revertida):', error);
    throw error; // Lança o erro para que o processo que o chamou saiba que falhou
  } finally {
    client.release();
  }
}

// Esta verificação permite que o script seja executado diretamente pelo Node.js
// (ex: `npm run seed:dev`), mas não quando é importado por outro arquivo (como nos testes).
if (require.main === module) {
  seedDatabase().finally(() => {
    console.log('🛑 Pool de conexões do seed encerrado.');
    db.pool.end();
  });
}
