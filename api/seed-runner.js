// Carrega as variáveis de ambiente do arquivo .env.development
require('dotenv').config({ path: '.env.development' });

// Registra o tsconfig-paths para que o ts-node entenda os alias como '@/'
require('tsconfig-paths/register');

// Executa o script de seed do TypeScript
require('./src/db/seed.ts');
