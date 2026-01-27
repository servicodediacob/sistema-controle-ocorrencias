// frontend/src/components/LancamentoTabela.test.tsx

import { vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LancamentoTabela, { NaturezaTabela } from './LancamentoTabela';
import { ICidade, IEstatisticaAgrupada } from '../services/api';

// --- Mocks ---

const mockNaturezasTabela: NaturezaTabela[] = [
  { codigo: '1.1', nome: 'Incêndio em Vegetação', subgrupo: 'Incêndio', abreviacao: 'Inc. Veg.' },
  { codigo: '1.2', nome: 'Incêndio em Edificação', subgrupo: 'Incêndio', abreviacao: 'Inc. Edif.' },
  { codigo: '2.1', nome: 'Busca e Salvamento', subgrupo: 'Salvamento', abreviacao: 'Busca Salv.' },
];

const mockCidades: ICidade[] = [
  { id: 1, cidade_nome: 'Unidade A', crbm_id: 1, crbm_nome: 'CRBM I' },
  { id: 2, cidade_nome: 'Unidade B', crbm_id: 2, crbm_nome: 'CRBM II' },
];

const mockDadosApi: IEstatisticaAgrupada[] = [
  { quantidade: 5, crbm_nome: 'CRBM I', cidade_nome: 'Unidade A', natureza_nome: 'Incêndio em Vegetação', natureza_abreviacao: 'Inc. Veg.' },
  { quantidade: 2, crbm_nome: 'CRBM I', cidade_nome: 'Unidade A', natureza_nome: 'Busca e Salvamento', natureza_abreviacao: 'Busca Salv.' },
  { quantidade: 10, crbm_nome: 'CRBM II', cidade_nome: 'Unidade B', natureza_nome: 'Incêndio em Edificação', natureza_abreviacao: 'Inc. Edif.' },
];

const mockOnEdit = vi.fn();

// --- Helper ---

interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: NaturezaTabela[];
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions?: boolean;
  canEditObmId?: number | null;
  isAdmin?: boolean;
}

const renderComponent = (props: Partial<LancamentoTabelaProps> = {}) => {
  const defaultProps: LancamentoTabelaProps = {
    dadosApi: mockDadosApi,
    naturezas: mockNaturezasTabela,
    onEdit: mockOnEdit,
    cidades: mockCidades,
    loading: false,
    showActions: true,
    isAdmin: true,
  };
  return render(<LancamentoTabela {...defaultProps} {...props} />);
};

describe('LancamentoTabela', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar os cabeçalhos e os dados corretamente', () => {
    renderComponent();

    expect(screen.getByRole('columnheader', { name: /Inc. Veg./i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Quartel \/ Cidade/i })).toBeInTheDocument();

    const linhaUnidadeA = screen.getByRole('row', { name: /Unidade A/i });
    expect(within(linhaUnidadeA).getByText('5')).toBeInTheDocument();
    expect(within(linhaUnidadeA).getByText('2')).toBeInTheDocument();

    const linhaUnidadeB = screen.getByRole('row', { name: /Unidade B/i });

    const celulasUnidadeB = within(linhaUnidadeB).getAllByRole('cell');
    // Índices: 0=CRBM, 1=Cidade, 2=Inc.Veg, 3=Inc.Edif, 4=Busca Salv., 5=TOTAL, 6=AÇÕES
    expect(celulasUnidadeB[3]).toHaveTextContent('10');
  });

  it('deve chamar onEdit com os dados corretos da linha ao clicar no botão de editar', () => {
    renderComponent();

    const linhaUnidadeA = screen.getByRole('row', { name: /Unidade A/i });
    const editButton = within(linhaUnidadeA).getByRole('button', { name: /editar/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);

    const expectedCidade = mockCidades[0];
    const expectedDadosAtuais = {
      '1.1': 5,
      '1.2': 0,
      '2.1': 2,
    };

    expect(mockOnEdit).toHaveBeenCalledWith(expectedCidade, expectedDadosAtuais);
  });

  it('deve exibir um estado de carregamento quando loading for true', () => {
    renderComponent({ loading: true });

    const loadingIndicator = screen.queryByTestId('skeleton-table');
    expect(loadingIndicator).toBeInTheDocument();
  });
});
