// api/scripts/migrate-dev.js

const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis do arquivo .env.development
const envPath = path.resolve(__dirname, '..', '.env.development');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Erro ao carregar o arquivo .env.development:', result.error);
  process.exit(1);
}

console.log('✅ Variáveis de ambiente de desenvolvimento carregadas.');
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'Encontrada' : 'NÃO ENCONTRADA'}`);

// Pega os argumentos passados para o script npm, ignorando os dois primeiros ('node' e o nome do script)
const args = process.argv.slice(2).join(' ');

// Monta o comando final do Prisma
const command = `npx prisma migrate dev ${args}`;

console.log(`\n🚀 Executando comando: ${command}\n`);

try {
  // Executa o comando e redireciona a saída para o console atual
  execSync(command, { stdio: 'inherit' });
  console.log('\n✅ Migração de desenvolvimento concluída com sucesso.');
} catch (error) {
  console.error('\n❌ Falha ao executar a migração de desenvolvimento.');
  // O erro do processo filho já será exibido pelo stdio: 'inherit'
  process.exit(1);
}
