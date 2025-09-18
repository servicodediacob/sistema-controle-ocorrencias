import bcrypt from 'bcryptjs';
import db from './index'; // Corrigido: importação padrão

async function seedDatabase() {
  const client = await db.pool.connect(); // Corrigido: acessa o pool via 'db.pool'
  console.log('Iniciando o processo de seeding...');

  try {
    await client.query('BEGIN');

    // Limpar tabelas existentes
    await client.query('DELETE FROM supervisor_plantao');
    await client.query('DELETE FROM ocorrencia_destaque');
    await client.query('DELETE FROM obitos');
    await client.query('DELETE FROM ocorrencias');
    await client.query('DELETE FROM usuarios');
    await client.query('DELETE FROM obms');
    await client.query('DELETE FROM crbms');
    await client.query('DELETE FROM naturezas_ocorrencia');
    console.log('Tabelas existentes foram limpas.');

    // 1. Inserir CRBMs
    const crbm1Result = await client.query("INSERT INTO crbms (nome) VALUES ('CRBM I') RETURNING id");
    const crbm2Result = await client.query("INSERT INTO crbms (nome) VALUES ('CRBM II') RETURNING id");
    const crbm1Id = crbm1Result.rows[0].id;
    const crbm2Id = crbm2Result.rows[0].id;
    console.log('CRBMs inseridos.');

    // 2. Inserir OBMs
    await client.query("INSERT INTO obms (nome, crbm_id) VALUES ('1º BBM - Capital', $1)", [crbm1Id]);
    await client.query("INSERT INTO obms (nome, crbm_id) VALUES ('2º BBM - Interior', $1)", [crbm1Id]);
    await client.query("INSERT INTO obms (nome, crbm_id) VALUES ('3º BBM - Interior', $1)", [crbm2Id]);
    console.log('OBMs inseridas.');

    // 3. Inserir Naturezas de Ocorrência
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Incêndio em Vegetação')");
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Atendimento Pré-Hospitalar')");
    await client.query("INSERT INTO naturezas_ocorrencia (descricao) VALUES ('Acidente de Trânsito')");
    console.log('Naturezas de Ocorrência inseridas.');

    // 4. Inserir Usuário Supervisor
    const senhaPlana = 'supervisor123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', senhaHash]
    );
    console.log('Usuário supervisor inserido.');
    console.log('--- Credenciais de Teste ---');
    console.log('Email: supervisor@cbm.pe.gov.br');
    console.log('Senha: supervisor123');
    console.log('---------------------------');

    // 5. Inserir configurações padrão
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    console.log('Tabelas de gestão inicializadas.');

    await client.query('COMMIT');
    console.log('Seeding concluído com sucesso! Transação efetivada.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante o seeding (transação revertida):', error);
  } finally {
    client.release();
    console.log('Conexão com o banco de dados liberada.');
    await db.pool.end(); // Corrigido: acessa o pool via 'db.pool'
    console.log('Pool de conexões encerrado.');
  }
}

seedDatabase();
