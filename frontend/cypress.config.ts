// frontend/cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base da sua aplicação frontend quando em desenvolvimento
    baseUrl: 'http://localhost:5173',
    
    // Função de setup para listeners de eventos do Node.
    // Pode ser útil no futuro, mas por agora, pode ficar assim.
    setupNodeEvents(on, config ) {
      // implement node event listeners here
    },
  },
});
