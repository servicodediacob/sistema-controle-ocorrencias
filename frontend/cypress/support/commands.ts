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
  const apiBase = Cypress.env('apiBase') || 'http://localhost:3001/api';
  cy.request('POST', `${apiBase}/auth/login`, { email, senha }).then((resp) => {
    expect(resp.status).to.be.oneOf([200]);
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
