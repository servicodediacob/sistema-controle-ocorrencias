// api/generate-hash.js

const bcrypt = require('bcryptjs');

// --- DEFINA A SENHA TEMPORÁRIA AQUI ---
// Escolha uma senha forte e temporária.
const senhaTemporaria = 'TempAdmin@2025'; 
// ------------------------------------

console.log(`Gerando hash para a senha: "${senhaTemporaria}"`);

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(senhaTemporaria, salt);

console.log('\n--- HASH DA SENHA GERADO ---');
console.log('Copie a linha abaixo e guarde-a para o próximo passo.');
console.log('É uma linha longa e deve começar com "$2a$..."');
console.log('\n');
console.log(hash);
console.log('\n------------------------------');
