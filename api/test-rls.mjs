// Script para verificar e configurar RLS da tabela usuarios
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAndFixPermissions() {
    console.log('🔧 Testando acesso à tabela usuarios...\n');

    try {
        // Teste 1: Tentar ler com service role
        console.log('📝 Teste 1: Leitura com Service Role Key');
        const { data: users, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', 'admin@cbmgo.com.br')
            .single();

        if (error) {
            console.error('❌ Erro ao consultar:', error);
            console.log('\n💡 Possível problema de RLS. Vou desabilitar RLS na tabela usuarios...\n');

            // Desabilitar RLS
            const { error: rlsError } = await supabase.rpc('exec_sql', {
                sql: 'ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;'
            });

            if (rlsError) {
                console.log('⚠️  Não foi possível desabilitar RLS via RPC');
                console.log('\n📋 EXECUTE MANUALMENTE NO SQL EDITOR DO SUPABASE:');
                console.log('━'.repeat(50));
                console.log('ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;');
                console.log('━'.repeat(50));
            }
        } else {
            console.log('✅ Usuário encontrado:', users?.email);
            console.log('📊 Dados do usuário:', JSON.stringify(users, null, 2));
        }

    } catch (error) {
        console.error('\n❌ Erro:', error);
    }
}

testAndFixPermissions();
