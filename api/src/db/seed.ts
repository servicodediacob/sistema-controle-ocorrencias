// Importa os módulos necessários
import bcrypt from 'bcryptjs';
import db from './index'; // Importa a instância do pool de conexão
import '../config/envLoader'; // Garante que as variáveis de ambiente sejam carregadas

// Função principal assíncrona
async function seedDevelopmentDatabase() {
  console.log('--- INICIANDO SEED DO BANCO DE DADOS DE DESENVOLVIMENTO ---');
  
  // Obtém um cliente do pool de conexões
  const client = await db.pool.connect();
  console.log('🔌 Conexão com o banco de dados estabelecida.');

  try {
    await client.query('BEGIN');
    console.log('1. Limpando tabelas existentes...');
    // A tabela 'ocorrencias' e 'obitos' não existem mais no schema novo, foram removidas da lista.
    await client.query('TRUNCATE TABLE solicitacoes_acesso, obitos_registros, estatisticas_diarias, supervisor_plantao, ocorrencia_destaque, ocorrencias_detalhadas, usuarios, obms, crbms, naturezas_ocorrencia RESTART IDENTITY CASCADE');

    console.log('2. Inserindo CRBMs...');
    await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      ON CONFLICT (nome) DO NOTHING;
    `);

    console.log('3. Inserindo OBMs...');
    const obmsPorCrbm = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'], '2º CRBM': ['Rio Verde', 'Jataí'], '3º CRBM': ['Anápolis', 'Pirenópolis'], '4º CRBM': ['Luziânia', 'Águas Lindas'], '5º CRBM': ['Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno'], '6º CRBM': ['Goiás', 'Iporá'], '7º CRBM': ['Itumbiara', 'Caldas'], '8º CRBM': ['Porangatu', 'Goianésia'], '9º CRBM': ['Formosa', 'Planaltina']
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

    console.log('4. Inserindo todas as Naturezas de Ocorrência...');
    const naturezasParaInserir = [
      { grupo: 'Resgate', subgrupo: 'Resgate', abreviacao: 'RESGATE' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio - Outros', abreviacao: 'INC. OUT.' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
      { grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
      { grupo: 'Busca e Salvamento', subgrupo: 'Busca e Salvamento - Diversos', abreviacao: 'B. SALV.' },
      { grupo: 'Ações Preventivas', subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
      { grupo: 'Ações Preventivas', subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
      { grupo: 'Ações Preventivas', subgrupo: 'Outros', abreviacao: 'AP. OUT' },
      { grupo: 'Ações Preventivas', subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
      { grupo: 'Atividades Técnicas', subgrupo: 'Atividades Técnicas - Outros', abreviacao: 'AT. OUT' },
      { grupo: 'Produtos Perigosos', subgrupo: 'Outros / Diversos', abreviacao: 'PPO' },
      { grupo: 'Produtos Perigosos', subgrupo: 'Vazamentos', abreviacao: 'PPV' },
      { grupo: 'Defesa Civil', subgrupo: 'De Resposta', abreviacao: 'DC RESP.' },
      { grupo: 'Defesa Civil', subgrupo: 'Preventiva', abreviacao: 'DC PREV.' },
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

    console.log('5. Inserindo usuário administrador padrão...');
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminSenhaHash = await bcrypt.hash(adminPassword, 10);
    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING`,
      ['Admin Padrão', 'admin@example.com', adminSenhaHash]
    );

    console.log('6. Inserindo dados de controle...');
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    
    await client.query('COMMIT');
    console.log('✅ BANCO DE DADOS DE DESENVOLVIMENTO PREPARADO COM SUCESSO!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ ERRO AO PREPARAR O BANCO DE DADOS DE DESENVOLVIMENTO:', error);
    // Lança o erro para que o processo termine com código de falha
    throw error;
  } finally {
    // Garante que a conexão seja sempre liberada
    await client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
  }
}

// Executa a função e encerra o processo
seedDevelopmentDatabase()
  .then(() => {
    console.log('Script de seed finalizado.');
    process.exit(0); // Encerra com sucesso
  })
  .catch(() => {
    console.error('Script de seed encontrou um erro e foi encerrado.');
    process.exit(1); // Encerra com falha
  });
