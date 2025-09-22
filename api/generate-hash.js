// api/generate-hash.js
const bcrypt = require('bcryptjs');

const senha = 'admin123'; // <-- TROQUE PELA SENHA REAL E SEGURA
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(senha, salt);

console.log('Sua senha em hash é:');
console.log(hash);
