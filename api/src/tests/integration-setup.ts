// api/src/tests/integration-setup.ts

process.env.NODE_ENV = 'test';
process.env.PORT = '0';

import fs from 'fs';
import path from 'path';
import { server } from '../server';
import db from '../db';
import bcrypt from 'bcryptjs'; // Importamos o bcryptjs

const SCHEMA_FILE_PATH = path.join(__dirname, '../db/schema.sql');

const seedTestDatabase = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Garante que o schema esteja atualizado antes de inserir dados
    const schemaSql = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');
    await client.query(schemaSql);

    // Insere CRBMs
    await client.query(`
      INSERT INTO crbms (nome) VALUES
      ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
      ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
      ON CONFLICT (nome) DO NOTHING;
    `);

    // Insere OBMs
    const obmsPorCrbm: Record<string, string[]> = {
      '1º CRBM': ['Goiânia - Diurno', 'Goiânia - Noturno'],
      '2º CRBM': ['Rio Verde', 'Jataí'],
      '3º CRBM': ['Anápolis', 'Pirenópolis'],
      '4º CRBM': ['Luziânia', 'Águas Lindas'],
      '5º CRBM': ['Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno'],
      '6º CRBM': ['Goiás', 'Iporá'],
      '7º CRBM': ['Itumbiara', 'Caldas'],
      '8º CRBM': ['Porangatu', 'Goianésia'],
      '9º CRBM': ['Formosa', 'Planaltina'],
    };
    for (const [crbmNome, obms] of Object.entries(obmsPorCrbm)) {
      const crbmResult = await client.query('SELECT id FROM crbms WHERE nome = $1', [crbmNome]);
      if (crbmResult.rows.length > 0) {
        const crbmId = crbmResult.rows[0].id;
        for (const obmNome of obms) {
          await client.query(
            'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) ON CONFLICT (nome) DO NOTHING',
            [obmNome, crbmId]
          );
        }
      }
    }

    // Insere TODAS as naturezas necessárias
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
      { grupo: 'Relatório de Óbitos', subgrupo: 'AUTO EXTERMÍNIO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'MAL SÚBITO', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'ACIDENTES COM VIATURAS', abreviacao: null },
      { grupo: 'Relatório de Óbitos', subgrupo: 'OUTROS', abreviacao: null },
    ];
    for (const nat of naturezasParaInserir) {
      await client.query(
        'INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES ($1, $2, $3) ON CONFLICT (grupo, subgrupo) DO NOTHING',
        [nat.grupo, nat.subgrupo, nat.abreviacao]
      );
    }

    // Adiciona a criação de um usuário administrador padrão para desenvolvimento.
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminSenhaHash = await bcrypt.hash(adminPassword, 10);

    await client.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, \'admin\') ON CONFLICT (email) DO NOTHING',
      ['ALEXANDRE', 'admin@cbm.pe.gov.br', adminSenhaHash]
    );

    await client.query('COMMIT');
    console.log('🚀 Banco de dados de teste limpo e semeado com dados completos (naturezas e usuário admin).');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro catastrófico durante o seeding no setup.ts:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Hooks do Jest
beforeAll(async () => {
  await seedTestDatabase();
});

afterAll(async () => {
  server.close();
  await db.pool.end();
  console.log('🛑 Servidor e pool do banco de dados fechados.');
});
