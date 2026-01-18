// Script para criar usuário no Supabase Auth + tabela usuarios
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Permite passar argumentos via CLI ou usar env vars
const userEmail = process.argv[2] || process.env.USER_EMAIL || 'timbo.correa@gmail.com';
const userPassword = process.argv[3] || process.env.USER_PASSWORD || 'senha123';
const userNome = process.argv[4] || process.env.USER_NOME || 'Usuário';
const userPerfil = process.argv[5] || process.env.USER_PERFIL || 'admin'; // admin, supervisor, user

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createUser() {
    console.log('\n🔧 Criando usuário...\n');
    console.log('📧 Email:', userEmail);
    console.log('👤 Nome:', userNome);
    console.log('🎭 Perfil:', userPerfil);
    console.log('');

    try {
        // 1. Criar/Atualizar usuário no Supabase Auth
        console.log('📝 Step 1: Criando usuário no Supabase Auth...');

        let authUserId = null;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: userPassword,
            email_confirm: true, // Auto-confirma o email
            user_metadata: {
                nome: userNome,
                perfil: userPerfil
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('⚠️  Usuário já existe no Supabase Auth');

                // Buscar usuário existente
                const { data: users } = await supabase.auth.admin.listUsers();
                const existingUser = users?.users?.find(u => u.email === userEmail);

                if (existingUser) {
                    authUserId = existingUser.id;
                    console.log('✅ Usuário encontrado no Auth:', authUserId);

                    // Atualizar senha se necessário
                    console.log('🔄 Atualizando senha...');
                    const { error: updateError } = await supabase.auth.admin.updateUserById(
                        authUserId,
                        { password: userPassword }
                    );

                    if (updateError) {
                        console.warn('⚠️  Não foi possível atualizar senha:', updateError.message);
                    } else {
                        console.log('✅ Senha atualizada');
                    }
                } else {
                    throw new Error('Usuário existe mas não foi encontrado');
                }
            } else {
                throw authError;
            }
        } else {
            authUserId = authData.user.id;
            console.log('✅ Usuário criado no Supabase Auth:', authUserId);
        }

        // 2. Criar/Atualizar registro na tabela usuarios
        console.log('\n📝 Step 2: Verificando tabela usuarios...');

        const { data: existingDbUser, error: checkError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingDbUser) {
            console.log('⚠️  Usuário já existe na tabela usuarios');

            // Atualizar perfil se necessário
            console.log('🔄 Atualizando perfil para:', userPerfil);
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({
                    perfil: userPerfil,
                    nome: userNome,
                    ativo: true
                })
                .eq('email', userEmail);

            if (updateError) {
                console.warn('⚠️  Erro ao atualizar usuário:', updateError.message);
            } else {
                console.log('✅ Perfil atualizado');
            }
        } else {
            console.log('📝 Criando registro na tabela usuarios...');
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert({
                    email: userEmail,
                    nome: userNome,
                    perfil: userPerfil,
                    ativo: true
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    console.log('⚠️  Usuário já existe na tabela usuarios (duplicate key)');
                } else {
                    throw insertError;
                }
            } else {
                console.log('✅ Usuário criado na tabela usuarios');
            }
        }

        console.log('\n✅ PROCESSO CONCLUÍDO COM SUCESSO!\n');
        console.log('📋 CREDENCIAIS:');
        console.log('━'.repeat(50));
        console.log(`Email:    ${userEmail}`);
        console.log(`Senha:    ${userPassword}`);
        console.log(`Nome:     ${userNome}`);
        console.log(`Perfil:   ${userPerfil}`);
        console.log('━'.repeat(50));
        console.log('\n💡 Use essas credenciais para fazer login no sistema.\n');

    } catch (error) {
        console.error('\n❌ ERRO ao criar/atualizar usuário:');
        console.error(error);
        console.error('\n💡 Verifique:');
        console.error('  - Se o arquivo .env contém SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
        console.error('  - Se a tabela "usuarios" existe no banco de dados');
        console.error('  - Se há regras RLS bloqueando a operação');
        process.exit(1);
    }
}

createUser();
