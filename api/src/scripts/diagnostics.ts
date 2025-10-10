// api/src/scripts/diagnostics.ts

// Carrega as variáveis de ambiente primeiro, usando o loader que criamos.
import '../config/envLoader';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

async function runDiagnostics() {
  console.log('--- INICIANDO DIAGNÓSTICO DO AMBIENTE DA API ---');
  let hasError = false;

  // 1. Verificar Variáveis de Ambiente Essenciais
  console.log('\n[ETAPA 1/3] Verificando variáveis de ambiente...');
  const dbUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (dbUrl && dbUrl.includes('localhost')) {
    console.log('  ✅ [ENV] DATABASE_URL encontrada e parece ser local.');
  } else {
    console.error('  ❌ [ENV] FALHA: DATABASE_URL não encontrada ou não aponta para localhost.');
    hasError = true;
  }

  if (jwtSecret && jwtSecret.length > 5) {
    console.log('  ✅ [ENV] JWT_SECRET encontrada.');
  } else {
    console.error('  ❌ [ENV] FALHA: JWT_SECRET não está definida ou é muito curta.');
    hasError = true;
  }

  // 2. Verificar Conexão com o Banco de Dados via Prisma
  console.log('\n[ETAPA 2/3] Verificando conexão com o banco de dados via Prisma...');
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('  ✅ [PRISMA] Conexão com o banco de dados bem-sucedida.');
    await prisma.$disconnect();
  } catch (error) {
    console.error('  ❌ [PRISMA] FALHA na conexão com o banco de dados.');
    console.error(`     - Erro: ${(error as Error).message}`);
    hasError = true;
  }

  // 3. Testar funcionalidade do JWT
  console.log('\n[ETAPA 3/3] Verificando funcionalidade do JWT...');
  try {
    if (!jwtSecret) throw new Error('JWT_SECRET não disponível para o teste.');
    const testPayload = { id: 'test' };
    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1s' });
    jwt.verify(token, jwtSecret);
    console.log('  ✅ [JWT] Geração e verificação de token funcionando corretamente.');
  } catch (error) {
    console.error('  ❌ [JWT] FALHA ao gerar ou verificar token JWT.');
    console.error(`     - Erro: ${(error as Error).message}`);
    hasError = true;
  }

  console.log('\n--- DIAGNÓSTICO CONCLUÍDO ---');

  if (hasError) {
    console.error('\n🔴 O diagnóstico encontrou um ou mais erros críticos. A API não pode iniciar corretamente.');
    process.exit(1); // Encerra com código de erro
  } else {
    console.log('\n🟢 Diagnóstico concluído com sucesso. O ambiente da API parece saudável.');
    process.exit(0); // Encerra com sucesso
  }
}

runDiagnostics();
