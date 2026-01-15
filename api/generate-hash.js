// api/generate-hash.js

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- GERADOR DE HASH DE SENHA ---');
rl.question('Digite a senha para o novo ADMINISTRADOR: ', (senha) => {
  if (!senha || senha.length < 6) {
    console.error('\n❌ Erro: A senha deve ter no mínimo 6 caracteres.');
    rl.close();
    return;
  }

  console.log('\nGerando hash...');

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(senha, salt);

  console.log('\n✅ HASH GERADO COM SUCESSO!');
  console.log('------------------------------------------------------------');
  console.log(hash);
  console.log('------------------------------------------------------------');
  console.log('Copie o hash acima e cole no seu script SQL para criar o usuário administrador.');
  
  rl.close();
});

// node generate-hash.js

