// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  
  // Carrega o arquivo de setup que aponta para o .env.test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Define a transformação de arquivos TypeScript usando ts-jest
  // e passa a configuração diretamente aqui.
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
};
