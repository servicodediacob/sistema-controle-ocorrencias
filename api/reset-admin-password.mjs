// Script para resetar senha do admin
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = 'admin@cbmgo.com.br';
const adminPassword = 'Cbmgo-Admin@2026';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetAdminPassword() {
    console.log('🔧 Resetando senha do admin...\n');

    try {
        // 1. Buscar o usuário pelo email
        console.log('🔍 Procurando usuário...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const adminUser = users?.users?.find(u => u.email === adminEmail);

        if (!adminUser) {
            console.error('❌ Usuário não encontrado no Supabase Auth');
            process.exit(1);
        }

        console.log('✅ Usuário encontrado:', adminUser.id);

        // 2. Atualizar a senha
        console.log('🔑 Atualizando senha...');
        const { error } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: adminPassword }
        );

        if (error) throw error;

        console.log('\n✅ SENHA RESETADA COM SUCESSO!\n');
        console.log('📋 CREDENCIAIS ATUALIZADAS:');
        console.log('━'.repeat(50));
        console.log(`Email:    ${adminEmail}`);
        console.log(`Senha:    ${adminPassword}`);
        console.log('━'.repeat(50));
        console.log('\n💡 Tente fazer login novamente com essas credenciais.');

    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

resetAdminPassword();
