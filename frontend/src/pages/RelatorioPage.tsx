import React, { useState } from 'react';
import styled from 'styled-components';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// Importa o layout principal para padronizar a página
import MainLayout from '../components/MainLayout';

// --- Styled Components ---
// A estrutura da página (PageWrapper, MainContent) é removida,
// pois o MainLayout já controla isso.

const FilterControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  background-color: #2c2c2c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  flex-wrap: wrap; /* Permite que os controles quebrem a linha em telas menores */
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
  padding: 0.65rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
`;

const GenerateButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #2a9d8f;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  align-self: flex-end;
  &:disabled {
    background-color: #2a9d8f80;
    cursor: not-allowed;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto; /* Rolagem horizontal para a tabela */
  border: 1px solid #555;
  border-radius: 4px;
  /* A rolagem vertical é controlada pelo MainLayout */
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 1600px;

  th, td {
    border: 1px solid #555;
    padding: 0.6rem;
    text-align: center;
    white-space: nowrap;
  }

  th {
    background-color: #3a3a3a;
    position: sticky;
    top: 0; /* Fixa o cabeçalho no topo do contêiner rolável (PageBody) */
    z-index: 3;
  }
  
  .group-cell {
    background-color: #4f4f4f;
    font-weight: bold;
    text-align: left;
    vertical-align: middle;
    position: sticky;
    left: 0;
    z-index: 2;
  }

  .subgroup-cell {
    text-align: left;
    position: sticky;
    left: 180px;
    background-color: #2c2c2c;
    z-index: 2;
  }

  .total-row td {
    background-color: #3a7ca5;
    font-weight: bold;
    color: white;
    position: sticky;
    bottom: 0; /* Fixa a linha de total na parte inferior */
    z-index: 1;
  }
`;

// --- Componente Principal da Página ---

function RelatorioPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const data = await getRelatorio(dataInicio, dataFim);
      setReportData(data);
      if (data.length === 0) {
        addNotification('Nenhum dado encontrado para o período selecionado.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar relatório.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  const crbmHeaders = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

  const calculateTotals = () => {
    const totals: { [key: string]: number } = {
      diurno: 0, noturno: 0, total_capital: 0, total_geral: 0,
      "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0,
    };
    reportData.forEach(row => {
      (Object.keys(totals) as Array<keyof typeof totals>).forEach(key => {
        totals[key] += Number(row[key as keyof IRelatorioRow]) || 0;
      });
    });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <MainLayout pageTitle="Relatório Estatístico de Ocorrências">
      <FilterControls>
        <ControlGroup>
          <Label htmlFor="data-inicio">Data de Início</Label>
          <InputDate id="data-inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </ControlGroup>
        <ControlGroup>
          <Label htmlFor="data-fim">Data de Fim</Label>
          <InputDate id="data-fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </ControlGroup>
        <GenerateButton onClick={handleGenerateReport} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </GenerateButton>
      </FilterControls>

      {loading && <p>Carregando relatório...</p>}

      {!loading && reportData.length > 0 && (
        <TableWrapper>
          <ReportTable>
            <thead>
              <tr>
                <th rowSpan={2} style={{width: '180px', left: 0, zIndex: 4}}>GRUPO</th>
                <th rowSpan={2} style={{width: '220px', left: 180, zIndex: 4}}>NATUREZA (SUBGRUPO)</th>
                <th colSpan={3}>ESTATÍSTICA CAPITAL</th>
                <th colSpan={9}>ESTATÍSTICA POR CRBM (INTERIOR)</th>
                <th rowSpan={2}>TOTAL GERAL</th>
              </tr>
              <tr style={{ top: '40px' }}> {/* Deslocamento para a segunda linha do cabeçalho */}
                <th>DIURNO</th>
                <th>NOTURNO</th>
                <th>TOTAL</th>
                {crbmHeaders.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  {subgrupos.map((row, index) => (
                    <tr key={`${grupo}-${row.subgrupo}`}>
                      {index === 0 && (
                        <td className="group-cell" rowSpan={subgrupos.length}>
                          {grupo}
                        </td>
                      )}
                      <td className="subgroup-cell">{row.subgrupo}</td>
                      <td>{row.diurno}</td>
                      <td>{row.noturno}</td>
                      <td>{row.total_capital}</td>
                      {crbmHeaders.map(h => <td key={h}>{row[h as keyof IRelatorioRow]}</td>)}
                      <td>{row.total_geral}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="total-row">
                <td colSpan={2} style={{left: 0, zIndex: 2}}>SUB TOTAL</td>
                <td>{totals.diurno}</td>
                <td>{totals.noturno}</td>
                <td>{totals.total_capital}</td>
                {crbmHeaders.map(h => <td key={h}>{totals[h]}</td>)}
                <td>{totals.total_geral}</td>
              </tr>
            </tbody>
          </ReportTable>
        </TableWrapper>
      )}
    </MainLayout>
  );
}

export default RelatorioPage;
