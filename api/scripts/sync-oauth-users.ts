import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[sync-oauth] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncOAuthUsers() {
    console.log('[sync-oauth] Buscando todos os usuários do Supabase Auth...');

    // 1. Buscar todos os usuários do Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('[sync-oauth] Erro ao listar usuários:', authError.message);
        throw authError;
    }

    console.log(`[sync-oauth] Encontrados ${authUsers.users.length} usuários no Auth`);

    let created = 0;
    let skipped = 0;

    // 2. Para cada usuário do Auth, verificar se existe na tabela usuarios
    for (const authUser of authUsers.users) {
        const email = authUser.email;

        if (!email) {
            console.log(`[sync-oauth] Usuário ${authUser.id} sem email, pulando...`);
            skipped++;
            continue;
        }

        // Verificar se já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (existing) {
            console.log(`[sync-oauth] ✓ ${email} - já existe (id: ${existing.id})`);
            skipped++;
            continue;
        }

        // Extrair nome do metadata do Auth ou do email
        const nome = authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            email.split('@')[0];

        // Criar na tabela usuarios
        const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([
                {
                    email,
                    nome,
                    perfil: 'user', // Por padrão, criar como 'user'. Admin deve promover manualmente
                    ativo: true,
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error(`[sync-oauth] ✗ ${email} - Erro ao criar:`, insertError.message);
            continue;
        }

        console.log(`[sync-oauth] ✓ ${email} - Criado com sucesso (id: ${newUser.id}, nome: ${newUser.nome})`);
        created++;
    }

    console.log('\n[sync-oauth] Resumo:');
    console.log(`  Total no Auth: ${authUsers.users.length}`);
    console.log(`  Criados: ${created}`);
    console.log(`  Já existiam: ${skipped}`);
}

syncOAuthUsers()
    .then(() => {
        console.log('\n[sync-oauth] Concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n[sync-oauth] Falha:', error);
        process.exit(1);
    });
