// Caminho: frontend/src/components/LancamentoModal.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LancamentoModal from './LancamentoModal';
import { AuthContext, IUser } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext'; // 1. IMPORTE O PROVEDOR

// ... (mocks de props e usuário permanecem os mesmos)
const mockCidades = [
  { id: 1, cidade_nome: 'Goiânia - Diurno', crbm_id: 1, crbm_nome: '1º CRBM' },
  { id: 2, cidade_nome: 'Rio Verde', crbm_id: 2, crbm_nome: '2º CRBM' },
];
const mockNaturezas = [
  { id: 10, grupo: 'Resgate', subgrupo: 'Resgate' },
  { id: 20, grupo: 'Incêndio', subgrupo: 'Incêndio em Vegetação' },
];
const mockOnClose = jest.fn();
const mockOnSave = jest.fn();
const adminUser: IUser = {
  id: 1,
  nome: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  obm_id: null,
};

// 2. ATUALIZE A FUNÇÃO DE RENDERIZAÇÃO
const renderComponent = () => {
  return render(
    // Envolvemos com todos os provedores que o componente precisa
    <NotificationProvider>
      <AuthContext.Provider 
        value={{ 
          usuario: adminUser, 
          isAuthenticated: true, 
          login: jest.fn(), 
          logout: jest.fn(),
          token: 'fake-test-token'
        }}
      >
        <LancamentoModal
          cidades={mockCidades}
          naturezas={mockNaturezas}
          onClose={mockOnClose}
          onSave={mockOnSave}
          itemParaEditar={null}
        />
      </AuthContext.Provider>
    </NotificationProvider>
  );
};

describe('Component Test - LancamentoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Os testes em si não precisam de alteração
  it('deve renderizar o formulário corretamente', () => {
    renderComponent();
    expect(screen.getByText('Formulário de Lançamento de Ocorrências')).toBeInTheDocument();
    expect(screen.getByLabelText('OBM (Obrigatório)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar Dados' })).toBeInTheDocument();
  });

  it('deve permitir a interação do usuário e chamar onSave com os dados corretos', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.selectOptions(screen.getByLabelText('OBM (Obrigatório)'), '1');
    await user.type(screen.getByLabelText('Resgate'), '5');
    await user.type(screen.getByLabelText('Incêndio em Vegetação'), '2');
    await user.click(screen.getByRole('button', { name: 'Enviar Dados' }));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      data_ocorrencia: new Date().toISOString().split('T')[0],
      cidade_id: 1,
      quantidades: { '10': '5', '20': '2' },
    });
  });

  it('deve chamar onClose ao clicar no botão Cancelar', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
