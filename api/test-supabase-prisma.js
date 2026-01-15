require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
    try {
        console.log('🔍 Testando conexão com Supabase via Prisma...\n');

        // Teste 1: Contar CRBMs
        const crbms = await prisma.cRBM.count();
        console.log(`✅ CRBMs: ${crbms}`);

        // Teste 2: Contar OBMs
        const obms = await prisma.oBM.count();
        console.log(`✅ OBMs: ${obms}`);

        // Teste 3: Contar Naturezas
        const naturezas = await prisma.naturezaOcorrencia.count();
        console.log(`✅ Naturezas: ${naturezas}`);

        // Teste 4: Verificar admin
        const admin = await prisma.usuario.findUnique({
            where: { email: 'admin@cbmgo.com.br' },
            select: { id: true, nome: true, email: true, role: true }
        });
        console.log(`✅ Admin encontrado:`, admin);

        console.log('\n🎉 Conexão com Supabase estabelecida com sucesso!');
        console.log('✅ Todas as tabelas estão acessíveis!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.code) {
            console.error('   Código:', error.code);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection();
