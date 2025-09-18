// backend/src/scripts/migrate.js

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync'); // Esta linha agora está correta
const db = require('../db');

const CSV_FILE_PATH = path.join(__dirname, '../data/historico_ocorrencias.csv');

/**
 * Função principal para executar a migração
 */
async function migrate() {
  console.log('🚀 Iniciando a migração de dados históricos...');

  const client = await db.pool.connect();
  console.log('✅ Conectado ao banco de dados.');

  try {
    await client.query('BEGIN');
    console.log('🔛 Transação iniciada.');

    // Carregar dados de apoio para mapeamento
    console.log('🔄 Carregando dados de apoio (OBMs e Naturezas)...');
    const obmsResult = await client.query('SELECT id, nome FROM obms');
    const naturezasResult = await client.query('SELECT id, descricao FROM naturezas_ocorrencia');

    const obmMap = new Map(obmsResult.rows.map(row => [row.nome.trim(), row.id]));
    const naturezaMap = new Map(naturezasResult.rows.map(row => [row.descricao.trim(), row.id]));
    console.log(`🗺️  Mapeamento criado: ${obmMap.size} OBMs e ${naturezaMap.size} Naturezas carregadas.`);

    // LER O ARQUIVO CSV DE FORMA SÍNCRONA
    console.log('📄 Lendo o arquivo CSV...');
    const fileContent = fs.readFileSync(CSV_FILE_PATH);
    
    // PROCESSAR O CONTEÚDO DE UMA VEZ
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`📊 ${records.length} registros encontrados no arquivo CSV.`);

    // Inserir os dados no banco de dados
    let insertedCount = 0;
    for (const [index, record] of records.entries()) {
      const obmId = obmMap.get(record.obm_nome);
      const naturezaId = naturezaMap.get(record.natureza_descricao);
      
      if (!obmId || !naturezaId) {
        console.warn(`⚠️  Registro ${index + 1} ignorado: OBM "${record.obm_nome}" ou Natureza "${record.natureza_descricao}" não encontrada.`);
        continue;
      }

      const query = `
        INSERT INTO ocorrencias (data_ocorrencia, natureza_id, obm_id, quantidade_obitos)
        VALUES ($1, $2, $3, $4)
      `;
      
      const values = [
        record.data_ocorrencia,
        naturezaId,
        obmId,
        parseInt(record.quantidade_obitos, 10) || 0,
      ];

      await client.query(query, values);
      insertedCount++;
    }

    console.log(`✅ ${insertedCount} de ${records.length} registros inseridos na tabela 'ocorrencias'.`);

    await client.query('COMMIT');
    console.log('🎉 Transação concluída com sucesso (COMMIT)! Migração finalizada.');

  } catch (error) {
    console.error('❌ Erro durante a migração. Revertendo a transação (ROLLBACK)...');
    console.error(error);
    await client.query('ROLLBACK');
    console.log('⏪ Transação revertida. Nenhuma alteração foi salva no banco.');
  } finally {
    client.release();
    console.log('🔌 Conexão com o banco de dados liberada.');
    await db.pool.end();
    console.log('🛑 Pool de conexões encerrado.');
  }
}

migrate();
