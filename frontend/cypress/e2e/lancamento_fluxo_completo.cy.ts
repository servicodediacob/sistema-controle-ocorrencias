// cypress/e2e/lancamento_fluxo_completo.cy.ts

describe('Fluxo Completo de Lançamento de Ocorrências', () => {
  const adminEmail = 'admin@cbm.pe.gov.br';
  const adminPassword = 'admin123';

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('deve permitir que um admin faça login, navegue e lance ocorrências em lote', () => {
    // --- 1. TELA DE LOGIN ---
    cy.log('Iniciando teste na tela de login...');
    cy.get('input[name="email"]').should('be.visible').type(adminEmail);
    cy.get('input[name="senha"]').should('be.visible').type(adminPassword);
    cy.get('button[type="submit"]').contains('Entrar').click();

    // --- 2. VERIFICAÇÃO DO DASHBOARD ---
    cy.log('Verificando se o login foi bem-sucedido e estamos no Dashboard...');
    cy.contains('h1', 'Dashboard do Supervisor', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/dashboard');

    // --- 3. NAVEGAÇÃO PARA A PÁGINA DE LANÇAMENTO ---
    cy.log('Navegando para a página de Lançamento de Ocorrências...');
    cy.get('body').then(($body) => {
      if ($body.find('nav button[title="Lançar Ocorrências"]:visible').length === 0) {
        cy.log('Menu lateral não visível. Abrindo menu mobile...');
        cy.get('button[aria-label="Abrir menu"]').click();
      }
    });
    cy.get('nav button[title="Lançar Ocorrências"]').click({ force: true });
    cy.contains('h1', 'Lançar Ocorrências').should('be.visible');
    cy.url().should('include', '/lancamento');

    // --- 4. ABRIR O MODAL DE LANÇAMENTO EM LOTE ---
    cy.log('Abrindo o modal de Lançamento em Lote...');
    cy.contains('button', 'Lançamento em Lote').click();
    cy.contains('h2', 'Formulário de Lançamento de Ocorrências').should('be.visible');

    // --- 5. PREENCHIMENTO DO FORMULÁRIO NO MODAL ---
    cy.log('Preenchendo o formulário de lançamento...');
    cy.get('input[placeholder="Digite para buscar uma OBM"]').type('Goiânia - Diurno');
    cy.contains('li', 'Goiânia - Diurno').click();
    cy.get('fieldset').contains('Resgate').parent().find('input[type="number"]').type('5');
    cy.get('fieldset').contains('Incêndio').parent().find('label:contains("Incêndio em Vegetação")').next('input').type('2');
    cy.get('fieldset').contains('Busca e Salvamento').parent().find('label:contains("Busca de Cadáver")').next('input').type('1');

    // --- 6. INTERCEPTAR A REQUISIÇÃO E SALVAR ---
    cy.log('Interceptando a requisição POST para /estatisticas/lote e salvando...');
    
    // CORREÇÃO NO TESTE: Vamos interceptar a chamada de API para garantir que ela seja feita.
    cy.intercept('POST', '**/api/estatisticas/lote').as('saveLote');

    cy.contains('button', 'Enviar Dados').click();

    // Aguarda a chamada de API ser completada e verifica o status da resposta.
    cy.wait('@saveLote').its('response.statusCode').should('eq', 201);

    // --- 7. VERIFICAÇÃO DA NOTIFICAÇÃO E DA TABELA ---
    cy.log('Verificando a notificação de sucesso e os dados na tabela...');
    cy.contains('estatística registrados com sucesso', { timeout: 10000 }).should('be.visible');
    cy.contains('Carregando dados da tabela...', { timeout: 15000 }).should('not.exist');
    cy.contains('td', 'Goiânia - Diurno')
      .parent('tr')
      .within(() => {
        cy.get('thead th').contains('RESGATE').invoke('index').then((index) => {
          cy.get('td').eq(index).should('contain.text', '5');
        });
        cy.get('thead th').contains('INC. VEG').invoke('index').then((index) => {
          cy.get('td').eq(index).should('contain.text', '2');
        });
        cy.get('thead th').contains('B. CADÁVER').invoke('index').then((index) => {
          cy.get('td').eq(index).should('contain.text', '1');
        });
        cy.get('td.bg-blue-900\\/30').should('contain.text', '8');
      });

    cy.log('Teste de fluxo completo concluído com sucesso!');
  });
});
