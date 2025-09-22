// Caminho: api/generate-token.js

const jwt = require('jsonwebtoken');

// --- CONFIGURAÇÕES ---
// Use o mesmo segredo do seu arquivo .env.production
const JWT_SECRET = 'cbmgocob193'; 

// ID do usuário para o qual queremos gerar o token.
// O script de seed cria o usuário 'admin' com ID 2 (o primeiro usuário é o supervisor com ID 1).
// Vamos usar o ID 2 para o usuário 'admin@cbm.pe.gov.br'.
const USER_ID = 2; 
const USER_NAME = 'Administrador de Teste';

// Tempo de expiração do token (ex: 1 hora)
const EXPIRES_IN = '1h';
// ---------------------


// Payload do token
const payload = {
  id: USER_ID,
  nome: USER_NAME,
};

// Gera o token
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });

console.log('--- SEU TOKEN DE AUTENTICAÇÃO ---');
console.log('');
console.log(token);
console.log('');
console.log('---------------------------------');
console.log(`Token gerado para o usuário: ${USER_NAME} (ID: ${USER_ID})`);
console.log(`Expira em: ${EXPIRES_IN}`);
