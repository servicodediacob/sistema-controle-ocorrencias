
import { Client } from 'pg';

const connectionString = "postgresql://postgres.rqhzudbbmsximjfvndyd:Cbmgo-Cob%402026@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function testConnection() {
    console.log(`Testing connection to: ${connectionString.replace(/:[^:]*@/, ':****@')}`);
    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log("Connection successful!");
        const res = await client.query('SELECT NOW()');
        console.log("Query result:", res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

testConnection();
