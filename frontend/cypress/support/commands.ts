/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Helper: limpa token salvo
Cypress.Commands.add('clearAuth', () => {
  cy.window().then((win) => {
    try { win.localStorage.removeItem('@siscob:token'); } catch {}
  });
});

// Login via API e injeta o token no localStorage
Cypress.Commands.add('loginByApi', (email: string, senha: string) => {
  const missing: string[] = [];
  if (!email) missing.push('adminEmail');
  if (!senha) missing.push('adminSenha');
  if (missing.length) {
    throw new Error(
      `[E2E] Variáveis de ambiente ausentes: ${missing.join(', ')}. ` +
        `Defina-as via cypress.env.json ou CLI (--env adminEmail=...,adminSenha=...).`
    );
  }

  const apiBase = Cypress.env('apiBase') || 'http://localhost:3001/api';

  cy.request({
    method: 'POST',
    url: `${apiBase}/auth/login`,
    body: { email, senha },
    failOnStatusCode: false, // para fornecer mensagem de erro mais clara
  }).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(
        `[E2E] Falha no login via API (${resp.status}). ` +
          `URL: ${apiBase}/auth/login. ` +
          `Verifique se o backend está rodando e se as credenciais estão corretas.`
      );
    }

    const token = (resp.body && (resp.body.token || resp.body?.data?.token)) as string;
    expect(token, 'token recebido').to.be.a('string').and.not.be.empty;
    cy.window().then((win) => {
      win.localStorage.setItem('@siscob:token', token);
    });
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      clearAuth(): Chainable<void>;
      loginByApi(email: string, senha: string): Chainable<void>;
    }
  }
}
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
