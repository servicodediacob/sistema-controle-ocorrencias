import { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import { 
  getObitosPorData, 
  criarObitoRegistro, 
  getNaturezasPorNomes,
  deleteObitoRegistro, // Importa a nova função de exclusão
  IObitoRegistro, 
  IObitoRegistroPayload,
  IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import RegistroObitoModal from '../components/RegistroObitoModal';
import { device } from '../styles/theme';

// --- Styled Components ---
const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  gap: 1rem;

  @media ${device.tablet} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ControlGroup = styled.div` 
  display: flex; 
  flex-direction: column; 
  gap: 0.5rem; 
`;

const Label = styled.label` 
  font-size: 0.9rem; 
  color: #aaa; 
`;

const InputDate = styled.input`
  padding: 0.75rem; 
  background-color: #3a3a3a;
  border: 1px solid #555; 
  color: white; 
  border-radius: 4px;
`;

const AddButton = styled.button`
  padding: 0.75rem 1.5rem; 
  border: none; 
  border-radius: 4px;
  background-color: #2a9d8f; 
  color: white; 
  font-size: 1rem; 
  cursor: pointer;
  
  &:disabled {
    background-color: #2a9d8f80;
    cursor: not-allowed;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 1rem;
  background-color: #2c2c2c; 
  border-radius: 8px; 
  overflow: hidden;
  min-width: 800px;
`;

const Th = styled.th`
  padding: 1rem; 
  text-align: left; 
  background-color: #3a3a3a;
  color: #aaa; 
  font-weight: bold;
  white-space: nowrap;
`;

const Td = styled.td` 
  padding: 1rem; 
  border-top: 1px solid #444; 
`;

const TotalRow = styled.tr` 
  background-color: #c62828; 
  font-weight: bold; 
  color: white; 
`;

const EmptyState = styled.div` 
  text-align: center; 
  padding: 3rem; 
  color: #888; 
`;

const DeleteButton = styled.button`
  background-color: #e76f51;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #d66041;
  }
`;

// --- Constantes ---
const NATUREZAS_FIXAS_NOMES = [
  'Acidente de Trânsito',
  'Acidentes com Viaturas',
  'Afogamento / Cadáver',
  'Arma de Fogo / Arma Branca / Agressão',
  'Autoextermínio',
  'Mal Súbito',
  'Outros'
];

// --- Componente Principal da Página ---
function RelatorioObitosPage(): ReactElement {
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [registros, setRegistros] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotification();

  // Busca a lista de naturezas para popular o formulário do modal
  useEffect(() => {
    getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES)
      .then(setNaturezas)
      .catch(() => addNotification('Falha ao carregar naturezas para o formulário.', 'error'));
  }, [addNotification]);

  // Função para buscar os registros de óbito para a data selecionada
  const fetchDadosDoDia = useCallback(async (data: string) => {
    setLoading(true);
    try {
      const result = await getObitosPorData(data);
      setRegistros(result);
    } catch (error) {
      addNotification('Falha ao carregar registros de óbitos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Efeito que dispara a busca de dados sempre que a data do relatório mudar
  useEffect(() => {
    fetchDadosDoDia(dataRelatorio);
  }, [dataRelatorio, fetchDadosDoDia]);

  // Função para salvar um novo registro, chamada pelo modal
  const handleSaveNewRegistro = async (formData: IObitoRegistroPayload) => {
    try {
      await criarObitoRegistro(formData);
      addNotification('Novo registro de óbito adicionado!', 'success');
      setIsModalOpen(false);
      fetchDadosDoDia(dataRelatorio);
    } catch (error) {
      addNotification('Falha ao salvar o novo registro.', 'error');
    }
  };

  // Função para excluir um registro
  const handleDeleteRegistro = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
      try {
        await deleteObitoRegistro(id);
        addNotification('Registro excluído com sucesso!', 'success');
        fetchDadosDoDia(dataRelatorio); // Atualiza a lista após a exclusão
      } catch (error) {
        addNotification('Falha ao excluir o registro.', 'error');
      }
    }
  };

  // Calcula o total de vítimas dos registros exibidos
  const totalGeral = registros.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
  const isButtonDisabled = naturezas.length === 0;

  return (
    <MainLayout pageTitle="Lançamento de Óbitos para Relatório">
      <ControlsContainer>
        <ControlGroup>
          <Label htmlFor="data-relatorio">Data do Relatório</Label>
          <InputDate
            id="data-relatorio"
            type="date"
            value={dataRelatorio}
            onChange={e => setDataRelatorio(e.target.value)}
          />
        </ControlGroup>
        <AddButton 
          onClick={() => setIsModalOpen(true)} 
          disabled={isButtonDisabled}
          title={isButtonDisabled ? "Aguardando carregamento das naturezas..." : "Adicionar novo registro de óbito"}
        >
          Adicionar Registro de Óbito
        </AddButton>
      </ControlsContainer>

      {loading ? (
        <EmptyState>Carregando registros...</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Natureza</Th>
                <Th>Nº Ocorrência (RAI)</Th>
                <Th>OBM Responsável</Th>
                <Th>Vítimas</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {registros.length > 0 ? (
                registros.map((reg) => (
                  <tr key={reg.id}>
                    <Td>{reg.natureza_nome}</Td>
                    <Td>{reg.numero_ocorrencia || 'N/I'}</Td>
                    <Td>{reg.obm_responsavel || 'N/I'}</Td>
                    <Td>{reg.quantidade_vitimas}</Td>
                    <Td>
                      <DeleteButton onClick={() => handleDeleteRegistro(reg.id)}>
                        Excluir
                      </DeleteButton>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={5} style={{ textAlign: 'center' }}>
                    Nenhum registro de óbito para esta data.
                  </Td>
                </tr>
              )}
              {registros.length > 0 && (
                <TotalRow>
                  <Td colSpan={3} style={{ textAlign: 'right', paddingRight: '1rem' }}>TOTAL DE VÍTIMAS</Td>
                  <Td>{totalGeral}</Td>
                  <Td></Td>
                </TotalRow>
              )}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      <RegistroObitoModal
        isOpen={isModalOpen}
        dataOcorrencia={dataRelatorio}
        naturezas={naturezas}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewRegistro}
      />
    </MainLayout>
  );
}

export default RelatorioObitosPage;
