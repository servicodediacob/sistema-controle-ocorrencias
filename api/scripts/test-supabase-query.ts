import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqhzudbbmsximjfvndyd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaHp1ZGJibXN4aW1qZnZuZHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzEyMTAsImV4cCI6MjA3OTI0NzIxMH0.eXnEo-y17XAJ2PNUkYvpOrMRKPg10LqgieiLJf19vbM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log('[test] Iniciando teste de query ao Supabase...');
    console.log('[test] URL:', supabaseUrl);

    try {
        console.log('[test] Testando query simples à tabela usuarios...');
        const startTime = Date.now();

        const { data, error, status } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', 'admin@cbmgo.com.br')
            .maybeSingle();

        const elapsed = Date.now() - startTime;

        console.log('[test] Query completada em', elapsed, 'ms');
        console.log('[test] Status:', status);
        console.log('[test] Erro:', error);
        console.log('[test] Dados:', data);

        if (error) {
            console.error('[test] ❌ Erro na query:', error);
        } else if (data) {
            console.log('[test] ✅ Usuário encontrado:', data.email, 'perfil:', data.perfil);
        } else {
            console.log('[test] ⚠️ Nenhum usuário encontrado');
        }
    } catch (err: any) {
        console.error('[test] ❌ Exceção:', err.message || err);
    }
}

testQuery()
    .then(() => {
        console.log('[test] Teste concluído');
        process.exit(0);
    })
    .catch((err) => {
        console.error('[test] Falha:', err);
        process.exit(1);
    });
