const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
        }
    },
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    try {
        console.log('🔍 Testando conexão com o banco de dados...');
        console.log('URL:', process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL);

        await prisma.$connect();
        console.log('✅ Conexão estabelecida com sucesso!');

        const result = await prisma.$queryRaw`SELECT version()`;
        console.log('📊 Versão do PostgreSQL:', result);

        await prisma.$disconnect();
        console.log('👋 Desconectado');
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConnection();
