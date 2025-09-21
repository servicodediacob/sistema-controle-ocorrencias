// api/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  
  // A linha abaixo foi removida
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], 

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
};
