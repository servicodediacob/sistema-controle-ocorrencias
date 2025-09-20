// frontend/src/pages/RelatorioObitosPage.tsx

import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import {
  getObitosPorData,
  criarObitoRegistro,
  atualizarObitoRegistro,
  limparRegistrosDoDia,
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

// NOVO: Container para os botões de ação
const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddButton = styled(ActionButton)`
  background-color: #2a9d8f;
`;

// NOVO: Botão para limpar a tabela
const ClearButton = styled(ActionButton)`
  background-color: #e76f51;
`;

// NOVO: Estilo para os detalhes clicáveis
const DetalheItem = styled.span`
  cursor: pointer;
  text-decoration: underline;
  color: #8bf1ff; // Cor ciano para indicar que é clicável
  
  &:hover {
    color: #aeffff;
  }
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
  // NOVO: Estado para guardar o registro que será editado
  const [registroEmEdicao, setRegistroEmEdicao] = useState<IObitoRegistro | null>(null);
  const { addNotification } = useNotification();

  // useEffect para carregar dados de apoio (naturezas e cidades) - sem alterações
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
    if (naturezasDoRelatorio.length > 0) {
      fetchDadosDoDia(dataRelatorio);
    }
  }, [dataRelatorio, naturezasDoRelatorio, fetchDadosDoDia]);

  // ATUALIZADO: Handler para salvar (criação ou edição)
  const handleSaveRegistro = async (formData: IObitoRegistroPayload, id?: number) => {
    try {
      if (id) { // Se tem ID, é edição
        await atualizarObitoRegistro(id, formData);
        addNotification('Registro atualizado com sucesso!', 'success');
      } else { // Senão, é criação
        await criarObitoRegistro(formData);
        addNotification('Novo registro de óbito adicionado!', 'success');
      }
      setIsModalOpen(false);
      setRegistroEmEdicao(null); // Limpa o registro em edição
      fetchDadosDoDia(dataRelatorio); // Recarrega os dados
    } catch (error) {
      addNotification('Falha ao salvar o registro.', 'error');
    }
  };

  // NOVO: Handler para abrir o modal em modo de edição
  const handleEditClick = (registro: IObitoRegistro) => {
    setRegistroEmEdicao(registro);
    setIsModalOpen(true);
  };
  
  // NOVO: Handler para o botão de limpar tabela
  const handleLimparTabela = async () => {
    if (registrosDoDia.length === 0) {
        addNotification('Não há registros para limpar.', 'info');
        return;
    }
    const dataFormatada = new Date(dataRelatorio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    if (window.confirm(`Tem certeza que deseja excluir TODOS os ${registrosDoDia.length} registros do dia ${dataFormatada}? Esta ação não pode ser desfeita.`)) {
      try {
        setLoading(true);
        await limparRegistrosDoDia(dataRelatorio);
        addNotification('Todos os registros do dia foram excluídos.', 'success');
        fetchDadosDoDia(dataRelatorio); // Recarrega a lista (que agora estará vazia)
      } catch (error) {
        addNotification('Falha ao limpar os registros.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRegistroEmEdicao(null);
    // Recarrega os dados caso uma exclusão tenha ocorrido dentro do modal
    fetchDadosDoDia(dataRelatorio);
  };

  const dadosTabela = naturezasDoRelatorio.map(natureza => {
    const registrosDaNatureza = registrosDoDia.filter(r => r.natureza_id === natureza.id);
    const quantidade = registrosDaNatureza.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
    
    return {
      nome: natureza.subgrupo,
      quantidade,
      registros: registrosDaNatureza // Passa a lista completa de registros para o render
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
        <ActionsContainer>
            <ClearButton onClick={handleLimparTabela} disabled={loading || registrosDoDia.length === 0}>
                Limpar Tabela
            </ClearButton>
            <AddButton onClick={() => setIsModalOpen(true)} disabled={loading}>
                Adicionar Registro
            </AddButton>
        </ActionsContainer>
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
              {dadosTabela.map((item) => (
                <tr key={item.nome}>
                  <Td>{item.nome}</Td>
                  <Td>{item.quantidade}</Td>
                  <Td>
                    {/* Mapeia os registros para criar os itens clicáveis */}
                    {item.registros.map((r, index) => (
                      <React.Fragment key={r.id}>
                        <DetalheItem onClick={() => handleEditClick(r)}>
                          {`(${(r.numero_ocorrencia || 'N/A')}) - ${r.obm_responsavel || 'N/A'} (${r.quantidade_vitimas})`}
                        </DetalheItem>
                        {index < item.registros.length - 1 && '; '}
                      </React.Fragment>
                    ))}
                  </Td>
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
          onClose={handleCloseModal}
          onSave={handleSaveRegistro}
          registroParaEditar={registroEmEdicao} // Passa o registro para o modal
        />
      )}
    </MainLayout>
  );
}

export default RelatorioObitosPage;
