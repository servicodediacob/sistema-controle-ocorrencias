// api/jest.config.js

module.exports = {
  maxWorkers: 1,
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
      tsconfig: 'tsconfig.jest.json'
    }],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Mantem bcryptjs fora do pipeline de transformacao para evitar problemas com bindings nativos.
  transformIgnorePatterns: [
    '/node_modules/(?!bcryptjs)/'
  ],
};
