// frontend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // Lida com importações de CSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
