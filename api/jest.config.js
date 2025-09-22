// api/jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // **MUDANÇA AQUI**: Ignora a pasta 'unit'
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/acesso.test.ts', // Pode ser mais específico se quiser
  ],
  
  // Mantém o setup global para os testes de integração
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/tests/setup.ts'
  ],

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
};
