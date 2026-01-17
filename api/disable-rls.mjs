// Script para desabilitar RLS na tabela usuarios
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const directUrl = process.env.DIRECT_DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
    console.log('🔧 Desabilitando RLS na tabela usuarios...\n');

    try {
        // Usar client do Supabase para executar SQL direto
        const { data, error } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;'
        });

        if (error) {
            console.log('⚠️  RPC não disponível. Execute manualmente:\n');
            console.log('━'.repeat(60));
            console.log('1. Acesse: https://supabase.com/dashboard/project/rqhzudbbmsximjfvndyd');
            console.log('2. Vá em "SQL Editor"');
            console.log('3. Execute o comando:'); console.log('');
            console.log('   ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;');
            console.log('');
            console.log('━'.repeat(60));
        } else {
            console.log('✅ RLS desabilitado com sucesso!');
        }

    } catch (error) {
        console.log('\n❌ Erro ao tentar desabilitar via RPC');
        console.log('\n📋 EXECUTE MANUALMENTE NO SQL EDITOR DO SUPABASE:');
        console.log('━'.repeat(60));
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Selecione seu projeto');
        console.log('3. Vá em "SQL Editor"');
        console.log('4. Execute:');
        console.log('');
        console.log('   ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('━'.repeat(60));
    }
}

disableRLS();
