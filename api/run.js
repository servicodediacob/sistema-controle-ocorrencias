// backend/run.js
const { spawn } = require('child_process');
const path = require('path');

// 1. Pega os argumentos da linha de comando
const [envFile, scriptPath, ...args] = process.argv.slice(2);

if (!envFile || !scriptPath) {
  console.error('Uso: node run.js <arquivo .env> <caminho para o script ts>');
  process.exit(1);
}

// 2. Define o caminho para o arquivo .env
const dotenvPath = path.resolve(process.cwd(), envFile);

// 3. Monta o comando para executar com ts-node
const command = 'npx';
const commandArgs = [
  'ts-node',
  '--require', 'dotenv/config', // Pede para o ts-node carregar o dotenv
  '--swc',
  scriptPath,
  ...args
];

// 4. Executa o processo filho com a variável de ambiente correta
const child = spawn(command, commandArgs, {
  stdio: 'inherit', // Redireciona a saída (logs, erros) para o terminal principal
  shell: true,      // Essencial para o npx funcionar corretamente no Windows
  env: {
    ...process.env, // Herda as variáveis de ambiente atuais
    DOTENV_CONFIG_PATH: dotenvPath, // Define o caminho do .env a ser usado pelo dotenv
  },
});

child.on('close', (code) => {
  process.exit(code);
});
