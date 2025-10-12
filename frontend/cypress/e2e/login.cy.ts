// frontend/cypress/e2e/login.cy.ts

describe('Fluxo de Login', () => {
  it('deve permitir que um usuário admin faça login e seja redirecionado para o dashboard', () => {
    const email = Cypress.env('adminEmail');
    const senha = Cypress.env('adminSenha');
    expect(email, 'Cypress.env("adminEmail")').to.be.a('string').and.not.be.empty;
    expect(senha, 'Cypress.env("adminSenha")').to.be.a('string').and.not.be.empty;

    // 1. Interceptar a chamada para a API de login
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    // 2. Visitar a página limpando token antes do app montar
    cy.visit('/login', {
      onBeforeLoad(win) {
        try { win.localStorage.removeItem('@siscob:token'); } catch {}
      },
    });

    // 3. Preencher o formulário
    cy.get('input[name="email"]').should('be.visible').clear().type(email);
    cy.get('input[name="senha"]').should('be.visible').clear().type(senha);

    // 4. Clicar no botão de login
    cy.get('button[type="submit"]').click();

    // 5. Esperar a resposta da API e verificar se foi bem-sucedida
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    // 6. Verificar redirecionamento e conteúdo
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard').should('be.visible');
  });
});

