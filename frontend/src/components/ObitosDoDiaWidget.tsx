import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getObitosPorData, getNaturezasPorNomes, IObitoRegistro, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// --- Styled Components ---
const WidgetContainer = styled.div`
  background-color: #2c2c2c;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  margin-top: 1.5rem;
`;

const WidgetTitle = styled.h3`
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
  color: #e0e0e0;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
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

const DetalheItem = styled.span`
  color: #8bf1ff;
`;

const NATUREZAS_FIXAS_NOMES = [
  'ACIDENTE DE TRÂNSITO', 'AFOGAMENTO OU CADÁVER', 'ARMA DE FOGO/BRANCA/AGRESSÃO',
  'AUTO EXTÉRMÍNIO', 'MAL SÚBITO', 'ACIDENTES COM VIATURAS', 'OUTROS'
];

function ObitosDoDiaWidget() {
  const [dataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezasDoRelatorio, setNaturezasDoRelatorio] = useState<IDataApoio[]>([]);
  const [registrosDoDia, setRegistrosDoDia] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchDados = useCallback(async () => {
    setLoading(true);
    try {
      const [naturezasData, obitosData] = await Promise.all([
        getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES),
        getObitosPorData(dataRelatorio)
      ]);
      setNaturezasDoRelatorio(naturezasData);
      setRegistrosDoDia(obitosData);
    } catch (error) {
      addNotification('Falha ao carregar dados de óbitos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, dataRelatorio]);

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchDados]);

  const dadosTabela = naturezasDoRelatorio.map(natureza => {
    const registrosDaNatureza = registrosDoDia.filter(r => r.natureza_id === natureza.id);
    const quantidade = registrosDaNatureza.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
    return {
      nome: natureza.subgrupo,
      quantidade,
      registros: registrosDaNatureza
    };
  });

  const totalGeral = dadosTabela.reduce((acc, curr) => acc + curr.quantidade, 0);

  return (
    <WidgetContainer>
      <WidgetTitle>Relatório de Óbitos do Dia</WidgetTitle>
      {loading && registrosDoDia.length === 0 ? (
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
                    {item.registros.map((r, index) => (
                      <React.Fragment key={r.id}>
                        <DetalheItem>
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
    </WidgetContainer>
  );
}

export default ObitosDoDiaWidget;
