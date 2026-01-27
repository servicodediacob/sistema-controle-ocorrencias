import { Client } from 'pg';
import 'dotenv/config';

async function test() {
    const client = new Client({
        connectionString: "postgresql://postgres.rqhzudbbmsximjfvndyd:Cbmgo-Cob%402026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require",
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('Connected successfully to pooler');
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

test();
