// Script para criar usuário administrador
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@cbmgo.com.br';
const adminPassword = process.env.ADMIN_PASSWORD || 'Cbmgo-Admin@2026';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    console.log('🔧 Criando usuário administrador...\n');

    try {
        // 1. Criar usuário no Supabase Auth
        console.log('📝 Criando usuário no Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                nome: 'Administrador',
                perfil: 'admin'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('⚠️  Usuário já existe no Supabase Auth');

                // Buscar usuário existente
                const { data: users } = await supabase.auth.admin.listUsers();
                const existingUser = users?.users?.find(u => u.email === adminEmail);

                if (existingUser) {
                    console.log('✅ Usuário encontrado:', existingUser.id);

                    // Verificar se existe na tabela usuarios
                    const { data: dbUser, error: dbError } = await supabase
                        .from('usuarios')
                        .select('*')
                        .eq('email', adminEmail)
                        .single();

                    if (dbError && dbError.code !== 'PGRST116') {
                        throw dbError;
                    }

                    if (dbUser) {
                        console.log('✅ Usuário já existe na tabela usuarios');
                        console.log('\n📋 CREDENCIAIS:');
                        console.log('━'.repeat(50));
                        console.log(`Email:    ${adminEmail}`);
                        console.log(`Senha:    ${adminPassword}`);
                        console.log(`Perfil:   ${dbUser.perfil}`);
                        console.log('━'.repeat(50));
                        return;
                    }

                    // Criar na tabela usuarios se não existir
                    console.log('📝 Criando registro na tabela usuarios...');
                    const { error: insertError } = await supabase
                        .from('usuarios')
                        .insert({
                            email: adminEmail,
                            nome: 'Administrador',
                            perfil: 'admin',
                            ativo: true
                        });

                    if (insertError) throw insertError;

                    console.log('✅ Usuário criado na tabela usuarios');
                    console.log('\n📋 CREDENCIAIS:');
                    console.log('━'.repeat(50));
                    console.log(`Email:    ${adminEmail}`);
                    console.log(`Senha:    ${adminPassword}`);
                    console.log(`Perfil:   admin`);
                    console.log('━'.repeat(50));
                    return;
                }
            }
            throw authError;
        }

        console.log('✅ Usuário criado no Supabase Auth:', authData.user.id);

        // 2. Criar registro na tabela usuarios
        console.log('📝 Criando registro na tabela usuarios...');
        const { error: dbError } = await supabase
            .from('usuarios')
            .insert({
                email: adminEmail,
                nome: 'Administrador',
                perfil: 'admin'
            });

        if (dbError) {
            if (dbError.code === '23505') {
                console.log('⚠️  Usuário já existe na tabela usuarios');
            } else {
                throw dbError;
            }
        } else {
            console.log('✅ Usuário criado na tabela usuarios');
        }

        console.log('\n✅ USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO!\n');
        console.log('📋 CREDENCIAIS:');
        console.log('━'.repeat(50));
        console.log(`Email:    ${adminEmail}`);
        console.log(`Senha:    ${adminPassword}`);
        console.log(`Perfil:   admin`);
        console.log('━'.repeat(50));
        console.log('\n💡 Use essas credenciais para fazer login no sistema.');

    } catch (error) {
        console.error('\n❌ Erro ao criar usuário:', error);
        process.exit(1);
    }
}

createAdminUser();
