// Este script existe para resolver problemas de compatibilidade do ts-node com terminais Windows.
// Ele executa o seed do Prisma de forma programática.

const { execSync } = require('child_process');

try {
  console.log('Executando o script de seed do Prisma com ts-node...');
  
  // Comando que funciona de forma confiável em todos os ambientes
  const command = 'ts-node --require tsconfig-paths/register prisma/seed.ts';
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('Script de seed executado com sucesso.');

} catch (error) {
  console.error('Falha ao executar o script de seed:', error);
  process.exit(1);
}
