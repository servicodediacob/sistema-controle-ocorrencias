// api/jest.unit.config.js

// Pega a configuração base
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig, // Herda tudo da configuração principal
  
  // Encontra apenas os testes dentro da pasta 'unit'
  testMatch: ['**/tests/unit/**/*.test.ts'],
  
  // **PONTO CRÍTICO**: NÃO usa o setup global que acessa o banco de dados.
  // Deixamos 'setupFilesAfterEnv' apenas com o setup do dotenv.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], 
};
