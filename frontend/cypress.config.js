// frontend/cypress.config.js

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    // IMPORTANTE: Desligar o isolamento de teste para que o login persista
    // entre os comandos cy.visit( ) dentro do mesmo teste.
    testIsolation: false,
    defaultCommandTimeout: 15000,
    requestTimeout: 20000,
    retries: 1,
  },
  env: {
    // Use variáveis de ambiente no CI/Prod; mantém fallback local para apiBase
    apiBase: process.env.CYPRESS_API_BASE || 'http://localhost:3001/api',
    adminEmail: process.env.CYPRESS_ADMIN_EMAIL,
    adminSenha: process.env.CYPRESS_ADMIN_SENHA,
  },
});
