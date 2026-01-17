// Script para adicionar admin na tabela usuarios
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = 'admin@cbmgo.com.br';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdminToTable() {
    console.log('📝 Adicionando admin à tabela usuarios...\n');

    try {
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (existing) {
            console.log('✅ Usuário já existe na tabela usuarios');
            console.log('\n📋 CREDENCIAIS DE ACESSO:');
            console.log('━'.repeat(50));
            console.log(`Email:    admin@cbmgo.com.br`);
            console.log(`Senha:    Cbmgo-Admin@2026`);
            console.log(`Perfil:   ${existing.perfil}`);
            console.log('━'.repeat(50));
            return;
        }

        // Inserir
        const { data, error } = await supabase
            .from('usuarios')
            .insert({
                email: adminEmail,
                nome: 'Administrador',
                perfil: 'admin'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Usuário criado com sucesso!\n');
        console.log('📋 CREDENCIAIS DE ACESSO:');
        console.log('━'.repeat(50));
        console.log(`Email:    admin@cbmgo.com.br`);
        console.log(`Senha:    Cbmgo-Admin@2026`);
        console.log(`Perfil:   admin`);
        console.log('━'.repeat(50));

    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

addAdminToTable();
