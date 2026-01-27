import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqhzudbbmsximjfvndyd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaHp1ZGJibXN4aW1qZnZuZHlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3MTIxMCwiZXhwIjoyMDc5MjQ3MjEwfQ.W-fMm1pAIIiaw3KpOf0UTAISn8zvqXcnhGWInuMogV0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTimboUser() {
    const email = 'timbo.correa@gmail.com';
    const password = 'Timbo@2026';

    console.log('[create-timbo] Criando usuário no Supabase Auth...');

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError) {
        if (authError.message?.includes('already registered') || (authError as any).code === 'email_exists') {
            console.log('[create-timbo] Usuário já existe no Auth, continuando...');
        } else {
            console.error('[create-timbo] Erro ao criar Auth user:', authError.message);
            throw authError;
        }
    } else {
        console.log('[create-timbo] Usuário criado no Auth:', authData.user.id);
    }

    // 2. Verificar se já existe na tabela usuarios
    const { data: existing, error: checkError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (checkError) {
        console.error('[create-timbo] Erro ao verificar usuário:', checkError.message);
        throw checkError;
    }

    if (existing) {
        console.log('[create-timbo] ✅ Usuário já existe na tabela usuarios:', existing);
        console.log('[create-timbo] Email:', email);
        console.log('[create-timbo] Senha:', password);
        return;
    }

    // 3. Criar na tabela usuarios
    const { data: userData, error: insertError } = await supabase
        .from('usuarios')
        .insert([
            {
                email,
                nome: 'Alexandre Correa',
                perfil: 'admin',
                ativo: true,
            },
        ])
        .select()
        .single();

    if (insertError) {
        console.error('[create-timbo] Erro ao inserir na tabela usuarios:', insertError.message);
        throw insertError;
    }

    console.log('[create-timbo] ✅ Usuário criado com sucesso na tabela usuarios:', userData);
    console.log('[create-timbo] Email:', email);
    console.log('[create-timbo] Senha:', password);
}

createTimboUser()
    .then(() => {
        console.log('[create-timbo] Concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[create-timbo] Falha:', error);
        process.exit(1);
    });
