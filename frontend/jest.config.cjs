// frontend/jest.config.cjs

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // A configuração mais importante para os testes de unidade
  transformIgnorePatterns: [
    '/node_modules/(?!jose)/',
  ],
};

module.exports = config;
