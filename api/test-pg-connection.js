require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log('🔍 Testando conexão direta com PostgreSQL...');
        console.log('URL:', process.env.DIRECT_DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!');

        const result = await client.query('SELECT version()');
        console.log('📊 Versão do PostgreSQL:', result.rows[0].version);

        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📋 Tabelas existentes:', tables.rows.map(r => r.table_name));

        await client.end();
        console.log('👋 Desconectado');
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        if (error.code) {
            console.error('Código do erro:', error.code);
        }
        process.exit(1);
    }
}

testConnection();
