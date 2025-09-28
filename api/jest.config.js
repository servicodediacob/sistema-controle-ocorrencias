// api/jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts',
  ],
  
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },

  // --- ADIÇÃO CRÍTICA ---
  // Esta configuração instrui o Jest a NÃO transformar o módulo 'bcryptjs'.
  // Isso é essencial para que módulos nativos ou com bindings em C++ funcionem corretamente.
  transformIgnorePatterns: [
    '/node_modules/(?!bcryptjs)/'
  ],
};
