const bcrypt = require('bcryptjs');
const db = require('./index');

// Adicionamos o pool aqui para garantir que ele seja encerrado no final do script
const { pool } = require('./index'); 

async function seedDatabase() {
  // Inicia a conexão com o banco de dados.
  // O arquivo .env carregado pelo comando 'dotenv-cli' determinará qual banco será usado.
  const client = await pool.connect();

  try {
    console.log('Iniciando o processo de seeding...');
    
    // Inicia uma transação para garantir que todas as operações sejam bem-sucedidas ou nenhuma.
    await client.query('BEGIN');

    // Limpar tabelas existentes na ordem correta para evitar erros de chave estrangeira
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

    // 4. Inserir um Usuário Supervisor com credenciais temporárias
    const senhaPlana = 'supervisor123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);

    await client.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)",
      ['Supervisor Padrão', 'supervisor@cbm.pe.gov.br', senhaHash]
    );
    console.log('Usuário supervisor inserido com sucesso.');
    console.log('--- Credenciais de Teste ---');
    console.log('Email: supervisor@cbm.pe.gov.br');
    console.log('Senha: supervisor123');
    console.log('---------------------------');

    // 5. Inserir as linhas de configuração padrão para as tabelas de gestão
    await client.query('INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    await client.query('INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING');
    console.log('Tabelas de gestão inicializadas.');

    // Se tudo deu certo, efetiva a transação
    await client.query('COMMIT');
    console.log('Seeding concluído com sucesso! Transação efetivada.');

  } catch (error) {
    // Se qualquer erro ocorreu, desfaz todas as operações
    await client.query('ROLLBACK');
    console.error('Erro durante o seeding (transação revertida):', error);
  } finally {
    // Libera a conexão de volta para o pool e encerra o processo
    client.release();
    console.log('Conexão com o banco de dados liberada.');
    pool.end(); // Encerra o pool para que o script termine completamente
  }
}

// Executa a função
seedDatabase();
