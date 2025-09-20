import { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import {
  getObitosPorData,
  criarObitoRegistro,
  getNaturezasPorNomes,
  getCidades,
  IObitoRegistro,
  IObitoRegistroPayload,
  IDataApoio,
  ICidade
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import RegistroObitoModal from '../components/RegistroObitoModal';
import { device } from '../styles/theme';

// --- Styled Components (sem alterações) ---
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
  min-width: 600px;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  background-color: #e53935;
  color: white;
  font-weight: bold;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 1rem;
  border-top: 1px solid #444;

  &:last-child {
    white-space: pre-wrap;
    word-break: break-word;
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

// --- Componente Principal ---

const NATUREZAS_FIXAS_NOMES = [
  'ACIDENTE DE TRÂNSITO',
  'AFOGAMENTO OU CADÁVER',
  'ARMA DE FOGO/BRANCA/AGRESSÃO',
  'AUTO EXTÉRMÍNIO',
  'MAL SÚBITO',
  'ACIDENTES COM VIATURAS',
  'OUTROS'
];

function RelatorioObitosPage(): ReactElement {
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezasDoRelatorio, setNaturezasDoRelatorio] = useState<IDataApoio[]>([]);
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [registrosDoDia, setRegistrosDoDia] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES),
      getCidades()
    ]).then(([naturezasData, cidadesData]) => {
      setNaturezasDoRelatorio(naturezasData);
      setCidades(cidadesData);
    }).catch(() => {
      addNotification('Falha ao carregar dados de apoio para o relatório.', 'error');
    }).finally(() => {
      setLoading(false);
    });
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
    // A busca de dados do dia só deve ocorrer após as naturezas serem carregadas
    if (naturezasDoRelatorio.length > 0) {
      fetchDadosDoDia(dataRelatorio);
    }
  }, [dataRelatorio, naturezasDoRelatorio, fetchDadosDoDia]);

  const handleSaveNewRegistro = async (formData: IObitoRegistroPayload) => {
    try {
      await criarObitoRegistro(formData);
      addNotification('Novo registro de óbito adicionado!', 'success');
      setIsModalOpen(false);
      fetchDadosDoDia(dataRelatorio); // Recarrega os dados do dia
    } catch (error) {
      addNotification('Falha ao salvar o novo registro.', 'error');
    }
  };

  // ==================================================================
  // CORREÇÃO APLICADA AQUI
  // A lógica agora itera sobre a lista completa de naturezas (`naturezasDoRelatorio`)
  // e, para cada uma, filtra os registros do dia correspondentes.
  // ==================================================================
  const dadosTabela = naturezasDoRelatorio.map(natureza => {
    // Filtra os registros do dia que correspondem à natureza atual
    const registrosDaNatureza = registrosDoDia.filter(r => r.natureza_id === natureza.id);
    
    // Soma a quantidade de vítimas para a natureza atual
    const quantidade = registrosDaNatureza.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
    
    // Monta a string de detalhes apenas se houver registros
    const detalhes = registrosDaNatureza.map(r => 
      `(${(r.numero_ocorrencia || 'N/A')}) - ${r.obm_responsavel || 'N/A'} (${r.quantidade_vitimas})`
    ).join('; ');

    return {
      nome: natureza.subgrupo, // Usa o nome da natureza da lista principal
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
        <AddButton onClick={() => setIsModalOpen(true)} disabled={loading}>
          Adicionar Registro de Óbito
        </AddButton>
      </ControlsContainer>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : (
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
              {/* O map agora itera sobre a lista completa, garantindo que todas as naturezas apareçam */}
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
          cidades={cidades}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewRegistro}
        />
      )}
    </MainLayout>
  );
}

export default RelatorioObitosPage;
