// cypress/e2e/lancamento_fluxo_completo.cy.ts

describe('Fluxo Completo de Lançamento de Dados', () => {
  beforeEach(() => {
    cy.clearAuth();
    const email = Cypress.env('adminEmail');
    const senha = Cypress.env('adminSenha');
    cy.loginByApi(email, senha);
  });

  it('deve lançar dados em lote e refletir na tabela', () => {
    // Intercepta chamadas relevantes
    cy.intercept('POST', '/api/estatisticas/lote').as('lote');
    cy.intercept('GET', '/api/estatisticas/por-data*').as('espelho');

    // Vai direto para a tela de lançamentos
    cy.visit('/lancar-ocorrencias');

    // Garante que a tabela inicial carregou
    cy.wait('@espelho');

    // Abre o modal
    cy.contains('button', /Lan.+amento em Lote/i).click();
    cy.contains('h2', /Formul.+rio de Lan.+amento de Ocorr.+ncias/i).should('be.visible');

    // Seleciona a OBM (GOIÂNIA - DIURNO)
    cy.get('input[placeholder="Digite para buscar uma OBM"]').type('GOIANIA');
    cy.get('[data-cy="searchable-select-list"]').should('be.visible');
    cy.get('[data-cy="searchable-select-list"] [data-cy="searchable-select-option"]').contains(/GOI.*DIURNO/i).click({ force: true });

    // Preenche RESGATE (id 1) com 5
    cy.get('#nat-1').clear().type('5');

    // Envia
    cy.contains('button', 'Enviar Dados').click({ force: true });

    // Aguarda o POST e aceita 200/201
    cy.wait('@lote').then((i) => {
      expect([200, 201]).to.include(i.response?.statusCode);
    });

    // Aguarda o refresh do espelho
    cy.wait('@espelho');

    // Verifica a linha de Goiânia - Diurno (3ª coluna = RESGATE)
    cy.contains('tr', /GOI.*DIURNO/i)
      .find('td')
      .eq(2)
      .should('contain.text', '5');
  });
});
