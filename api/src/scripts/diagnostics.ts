import '../config/envLoader'; // Carrega as variáveis de ambiente primeiro
import db from '../db';
import jwt from 'jsonwebtoken';

async function runDiagnostics() {
  console.log('--- INICIANDO DIAGNÓSTICO DO AMBIENTE ---');
  let hasError = false;

  // 1. Verificar Conexão com o Banco de Dados
  try {
    const timeResult = await db.query('SELECT NOW()');
    console.log('✅ [DB] Conexão com o banco de dados bem-sucedida.');
    console.log(`   - Horário do Servidor de DB: ${timeResult.rows[0].now}`);
  } catch (error) {
    console.error('❌ [DB] FALHA na conexão com o banco de dados.');
    console.error(`   - Erro: ${(error as Error).message}`);
    hasError = true;
  }

  // 2. Verificar Variáveis de Ambiente Essenciais
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length > 10) {
    console.log('✅ [ENV] Variável JWT_SECRET está presente e tem um tamanho razoável.');
  } else {
    console.error('❌ [ENV] FALHA: A variável JWT_SECRET não está definida ou é muito curta.');
    hasError = true;
  }

  // 3. Testar funcionalidade do JWT
  try {
    const testPayload = { id: 1, role: 'admin' };
    const token = jwt.sign(testPayload, jwtSecret as string, { expiresIn: '1s' });
    jwt.verify(token, jwtSecret as string);
    console.log('✅ [JWT] Geração e verificação de token funcionando corretamente.');
  } catch (error) {
    console.error('❌ [JWT] FALHA ao gerar ou verificar token JWT.');
    console.error(`   - Erro: ${(error as Error).message}`);
    hasError = true;
  }

  console.log('--- DIAGNÓSTICO CONCLUÍDO ---');

  if (hasError) {
    console.error('\n🔴 O diagnóstico encontrou um ou mais erros críticos. O deploy pode falhar.');
    process.exit(1); // Encerra com código de erro
  } else {
    console.log('\n🟢 Diagnóstico concluído com sucesso. O ambiente parece saudável.');
    process.exit(0); // Encerra com sucesso
  }
}

runDiagnostics();
