import { Client } from 'pg';

async function test() {
    const client = new Client({
        connectionString: "postgresql://postgres.fskhcmlrionkesvmgihi:SisgpoSupabase2024@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('Connected successfully to SISGPO');
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

test();
