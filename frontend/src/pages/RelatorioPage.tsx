import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// --- Styled Components ---
const Container = styled.div`
  padding: 2rem;
  max-width: 95%;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  color: #8bf;
  text-decoration: none;
`;

const FilterControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  background-color: #2c2c2c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
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
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 1400px;

  th, td {
    border: 1px solid #555;
    padding: 0.5rem;
    text-align: center;
    white-space: nowrap;
  }

  th {
    background-color: #3a3a3a;
    position: sticky;
    top: 0;
  }
  
  .group-header {
    background-color: #4f4f4f;
    font-weight: bold;
    text-align: left;
  }

  .subgroup-cell {
    text-align: left;
    padding-left: 1.5rem;
  }

  .total-row td {
    background-color: #3a7ca5;
    font-weight: bold;
    color: white;
  }
`;

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
    if (!acc[grupo]) {
      acc[grupo] = [];
    }
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
    <Container>
      <Header>
        <h1>Relatório Estatístico de Ocorrências</h1>
        <BackLink to="/dashboard">Voltar para o Dashboard</BackLink>
      </Header>

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
                <th rowSpan={2} style={{left: 0, zIndex: 2, position: 'sticky'}}>NATUREZA</th>
                <th colSpan={3}>ESTATÍSTICA CAPITAL</th>
                <th colSpan={9}>ESTATÍSTICA POR CRBM (INTERIOR)</th>
                <th rowSpan={2}>TOTAL GERAL</th>
              </tr>
              <tr>
                <th>DIURNO</th>
                <th>NOTURNO</th>
                <th>TOTAL</th>
                {crbmHeaders.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  <tr>
                    <td className="group-header" colSpan={14} style={{left: 0, zIndex: 1, position: 'sticky'}}>{grupo}</td>
                  </tr>
                  {subgrupos.map((row, index) => (
                    <tr key={index}>
                      <td className="subgroup-cell" style={{left: 0, zIndex: 1, position: 'sticky', backgroundColor: '#242424'}}>{row.subgrupo}</td>
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
                <td style={{left: 0, zIndex: 1, position: 'sticky'}}>SUB TOTAL</td>
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
    </Container>
  );
}

export default RelatorioPage;
