import '../config/envLoader';
import bcrypt from 'bcryptjs';
// CORREÇÃO: Usando o caminho absoluto a partir da pasta 'src'
import db from '@/db'; 

export async function seedDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';
  const client = await db.pool.connect();
  
  if (isProduction) {
    console.log('🌱 EXECUTANDO SEED EM MODO DE PRODUÇÃO (NÃO DESTRUTIVO)...');
  } else {
    console.log('🚀 Iniciando o processo de seeding em modo de desenvolvimento/teste (DESTRUTIVO)...');
  }

  try {
    await client.query('BEGIN');

    if (!isProduction) {
      console.log('🧹 Limpando tabelas existentes...');
      await client.query('TRUNCATE TABLE solicitacoes_acesso, obitos_registros, estatisticas_diarias, supervisor_plantao, ocorrencia_destaque, obitos, ocorrencias, usuarios, obms, crbms RESTART IDENTITY CASCADE');
      console.log('✅ Tabelas limpas.');
    }

    // ... (o restante do código do seed.ts permanece o mesmo) ...
    // 1. Inserir CRBMs
    await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      ON CONFLICT (nome) DO NOTHING;
    `);
    console.log('-> CRBMs verificados/inseridos.');

    // 2. Inserir OBMs
    const obmsPorCrbm = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí', 'Acreuna', 'Chapadão do Céu', 'Mineiros', 'Palmeiras', 'Quirinópolis', 'Santa Helena'],
      '3º CRBM': ['Anápolis', 'Pirenópolis'],
    };
    for (const [crbmNome, obms] of Object.entries(obmsPorCrbm)) {
      const crbmResult = await client.query('SELECT id FROM crbms WHERE nome = $1', [crbmNome]);
      if (crbmResult.rows.length > 0) {
        const crbmId = crbmResult.rows[0].id;
        for (const obmNome of obms) {
          await client.query("INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) ON CONFLICT (nome) DO NOTHING", [obmNome, crbmId]);
        }
      }
    }
    console.log('-> OBMs verificadas/inseridas.');

    // 3. Inserir Naturezas
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
    console.log('-> Naturezas verificadas/inseridas.');

    // 4. Inserir Usuário Admin
    const adminEmail = 'admin@cbm.pe.gov.br';
    const adminExists = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
    if (adminExists.rows.length === 0) {
      const adminSalt = await bcrypt.genSalt(10);
      const adminSenhaHash = await bcrypt.hash('admin123', adminSalt);
      await client.query(
        "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')",
        ['Administrador', adminEmail, adminSenhaHash]
      );
      console.log('-> Usuário Administrador criado.');
    } else {
      console.log('-> Usuário Administrador já existe.');
    }

    // 5. Configurações Padrão
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    console.log('-> Configurações padrão verificadas/inseridas.');

    await client.query('COMMIT');
    console.log('✅ Processo de seeding concluído com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding (transação revertida):', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase().finally(() => {
    console.log('🛑 Pool de conexões do seed encerrado.');
    db.pool.end();
  });
}
