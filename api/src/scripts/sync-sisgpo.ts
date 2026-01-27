import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SISGPO_URL = process.env.SISGPO_SUPABASE_URL;
const SISGPO_KEY = process.env.SISGPO_SUPABASE_KEY;

if (!SISGPO_URL || !SISGPO_KEY) {
    console.error('ERRO: SISGPO_SUPABASE_URL e SISGPO_SUPABASE_KEY devem estar no .env');
    process.exit(1);
}

const sisgpo = createClient(SISGPO_URL, SISGPO_KEY);

async function syncAll() {
    console.log('🚀 Iniciando Sincronização Total SISGPO -> SCO');

    // 1. Sincronizar OBMs
    console.log('--- Sincronizando OBMs ---');
    const { data: obms, error: obmError } = await sisgpo.from('obms').select('*');
    if (obmError) throw obmError;

    for (const obm of obms) {
        await prisma.obmSisgpo.upsert({
            where: { id: obm.id },
            update: {
                nome: obm.nome,
                abreviatura: obm.abreviatura,
                cidade: obm.cidade,
                telefone: obm.telefone,
                crbm: obm.crbm,
                updated_at: obm.updated_at ? new Date(obm.updated_at) : null,
            },
            create: {
                id: obm.id,
                nome: obm.nome,
                abreviatura: obm.abreviatura,
                cidade: obm.cidade,
                telefone: obm.telefone,
                crbm: obm.crbm,
                created_at: obm.created_at ? new Date(obm.created_at) : null,
                updated_at: obm.updated_at ? new Date(obm.updated_at) : null,
            }
        });
    }
    console.log(`✅ ${obms.length} OBMs sincronizadas.`);

    // 2. Sincronizar Militares
    console.log('\n--- Sincronizando Militares ---');
    const { data: mils, error: milError } = await sisgpo.from('militares').select('*');
    if (milError) throw milError;

    for (const mil of mils) {
        await prisma.militarSisgpo.upsert({
            where: { id: mil.id },
            update: {
                matricula: mil.matricula,
                nome_completo: mil.nome_completo,
                nome_guerra: mil.nome_guerra,
                posto_graduacao: mil.posto_graduacao,
                tipo: mil.tipo,
                ativo: mil.ativo,
                obm_nome: mil.obm_nome,
                telefone: mil.telefone,
                updated_at: mil.updated_at ? new Date(mil.updated_at) : null,
            },
            create: {
                id: mil.id,
                matricula: mil.matricula,
                nome_completo: mil.nome_completo,
                nome_guerra: mil.nome_guerra,
                posto_graduacao: mil.posto_graduacao,
                tipo: mil.tipo,
                ativo: mil.ativo,
                obm_nome: mil.obm_nome,
                telefone: mil.telefone,
                created_at: mil.created_at ? new Date(mil.created_at) : null,
                updated_at: mil.updated_at ? new Date(mil.updated_at) : null,
            }
        });
    }
    console.log(`✅ ${mils.length} Militares sincronizados.`);

    // 3. Sincronizar Viaturas
    console.log('\n--- Sincronizando Viaturas ---');
    const { data: viats, error: viatError } = await sisgpo.from('viaturas').select('*');
    if (viatError) throw viatError;

    for (const viat of viats) {
        await prisma.viaturaSisgpo.upsert({
            where: { id: viat.id },
            update: {
                prefixo: viat.prefixo,
                tipo: viat.tipo,
                ativa: viat.ativa,
                cidade: viat.cidade,
                obm: viat.obm,
                telefone: viat.telefone,
                updated_at: viat.updated_at ? new Date(viat.updated_at) : null,
            },
            create: {
                id: viat.id,
                prefixo: viat.prefixo,
                tipo: viat.tipo,
                ativa: viat.ativa,
                cidade: viat.cidade,
                obm: viat.obm,
                telefone: viat.telefone,
                created_at: viat.created_at ? new Date(viat.created_at) : null,
                updated_at: viat.updated_at ? new Date(viat.updated_at) : null,
            }
        });
    }
    console.log(`✅ ${viats.length} Viaturas sincronizadas.`);

    console.log('\n✨ Sincronização Concluída com Sucesso!');
}

syncAll()
    .catch(err => {
        console.error('❌ Erro na sincronização:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
