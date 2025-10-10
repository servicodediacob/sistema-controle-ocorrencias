// frontend/cypress/e2e/login.cy.ts

describe('Fluxo de Login', () => {
  it('deve permitir que um usuário admin faça login e seja redirecionado para o dashboard', () => {
    // 1. Interceptar a chamada para a API de login
    // Isso nos permite esperar por ela e verificar seu status.
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    // 2. Visitar a página limpando token antes do app montar
    cy.visit('/login', {
      onBeforeLoad(win) {
        try { win.localStorage.removeItem('@siscob:token'); } catch {}
      },
    });

    // 3. Preencher o formulário
    cy.get('input[name="email"]').should('be.visible').clear().type(Cypress.env('adminEmail'));
    cy.get('input[name="senha"]').should('be.visible').clear().type(Cypress.env('adminSenha'));

    // 4. Clicar no botão de login
    cy.get('button[type="submit"]').click();

    // 5. Esperar a resposta da API e verificar se foi bem-sucedida
    // O Cypress vai esperar até 5 segundos (padrão) pela resposta da chamada 'loginRequest'.
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    // 6. Agora, com a certeza de que a API respondeu com sucesso, verificamos a URL
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard').should('be.visible');
  });
});
