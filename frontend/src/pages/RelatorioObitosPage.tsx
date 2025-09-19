import { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import { 
  getObitosPorData, 
  criarObitoRegistro, 
  getNaturezasPorNomes,
  IObitoRegistro, 
  IObitoRegistroPayload,
  IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import RegistroObitoModal from '../components/RegistroObitoModal';
import { device } from '../styles/theme'; // 1. Importe nossos breakpoints

// --- Styled Components ---
const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  gap: 1rem; // Adiciona um espaçamento entre os itens

  // 2. Media query para telas de tablet e menores
  @media ${device.tablet} {
    flex-direction: column; // Empilha os controles verticalmente
    align-items: stretch; // Faz os controles ocuparem a largura total
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
`;

// 3. Adiciona um wrapper para a tabela para permitir rolagem horizontal
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
  min-width: 600px; // Garante que a tabela tenha uma largura mínima
`;

const Th = styled.th`
  padding: 1rem; 
  text-align: left; 
  background-color: #e53935;
  color: white; 
  font-weight: bold;
  white-space: nowrap; // Evita que o texto do cabeçalho quebre
`;

const Td = styled.td` 
  padding: 1rem; 
  border-top: 1px solid #444; 
  
  // 4. Permite que o conteúdo da célula de detalhes quebre a linha se necessário
  &:last-child {
    white-space: pre-wrap; // Quebra a linha em ';'
    word-break: break-word; // Força a quebra de palavras longas
  }
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

// --- Componente Principal (lógica sem alterações) ---

const NATUREZAS_FIXAS_NOMES = [
  'Acidente de Trânsito',
  'Acidentes com Viaturas',
  'Afogamento / Cadáver',
  'Arma de Fogo / Arma Branca / Agressão',
  'Autoextermínio',
  'Mal Súbito',
  'Outros'
];

function RelatorioObitosPage(): ReactElement {
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezasDoRelatorio, setNaturezasDoRelatorio] = useState<IDataApoio[]>([]);
  const [registrosDoDia, setRegistrosDoDia] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    setLoading(true);
    getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES)
      .then(setNaturezasDoRelatorio)
      .catch(() => addNotification('Falha ao carregar a estrutura de naturezas do relatório.', 'error'))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const fetchDadosDoDia = useCallback(async (data: string) => {
    setLoading(true);
    try {
      const result = await getObitosPorData(data);
      setRegistrosDoDia(result);
    } catch (error) {
      addNotification('Falha ao carregar registros de óbitos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (naturezasDoRelatorio.length > 0) {
      fetchDadosDoDia(dataRelatorio);
    }
  }, [dataRelatorio, naturezasDoRelatorio, fetchDadosDoDia]);

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

  const dadosTabela = naturezasDoRelatorio.map(natureza => {
    const registrosDaNatureza = registrosDoDia.filter(r => r.natureza_id === natureza.id);
    const quantidade = registrosDaNatureza.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
    const detalhes = registrosDaNatureza.map(r => 
      `(${(r.numero_ocorrencia || 'N/A')}) - ${r.obm_responsavel || 'N/A'} (${r.quantidade_vitimas})`
    ).join('; ');

    return {
      nome: natureza.subgrupo,
      quantidade,
      detalhes
    };
  });

  const totalGeral = dadosTabela.reduce((acc, curr) => acc + curr.quantidade, 0);

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
        <AddButton onClick={() => setIsModalOpen(true)} disabled={naturezasDoRelatorio.length === 0}>
          Adicionar Registro de Óbito
        </AddButton>
      </ControlsContainer>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : (
        // 5. Envolve a tabela com o TableWrapper
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>NATUREZA</Th>
                <Th>QTE</Th>
                <Th>NÚMERO RAI E OBM RESPONSÁVEL</Th>
              </tr>
            </thead>
            <tbody>
              {dadosTabela.map((item) => (
                <tr key={item.nome}>
                  <Td>{item.nome}</Td>
                  <Td>{item.quantidade}</Td>
                  <Td>{item.detalhes}</Td>
                </tr>
              ))}
              <TotalRow>
                <Td>TOTAL</Td>
                <Td>{totalGeral}</Td>
                <Td></Td>
              </TotalRow>
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {isModalOpen && (
        <RegistroObitoModal
          dataOcorrencia={dataRelatorio}
          naturezas={naturezasDoRelatorio}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewRegistro}
        />
      )}
    </MainLayout>
  );
}

export default RelatorioObitosPage;
