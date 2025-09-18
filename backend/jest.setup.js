// backend/jest.setup.js
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env.test
dotenv.config({ path: path.resolve(__dirname, './.env.test') });
