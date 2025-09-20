// Caminho: frontend/src/components/RelatorioWidget.tsx

import React, { useState, useEffect, ReactElement } from 'react';
import styled from 'styled-components';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
// A importação de 'device' foi REMOVIDA daqui

// --- Styled Components ---
const WidgetContainer = styled.div`
  background-color: #2c2c2c;
  border-radius: 8px;
  padding: 1.5rem;
  flex: 1;
  width: 100%;
`;

const WidgetTitle = styled.h3`
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #555;
  border-radius: 4px;
  width: 100%;
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 1200px;

  th, td {
    border: 1px solid #555;
    padding: 0.6rem;
    text-align: center;
    white-space: nowrap;
  }

  th {
    background-color: #3a3a3a;
    position: sticky;
    top: 0;
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
    width: 150px; 
  }

  .subgroup-cell {
    text-align: left;
    position: sticky;
    left: 150px; 
    background-color: #2c2c2c;
    z-index: 2;
    width: 200px;
  }

  .total-row td {
    background-color: #3a7ca5;
    font-weight: bold;
    color: white;
    position: sticky;
    bottom: 0;
    z-index: 1;
  }
`;

const EmptyState = styled.p`
  text-align: center;
  padding: 2rem;
  color: #888;
`;

// --- Componente ---
type CrbmKey = "1º CRBM" | "2º CRBM" | "3º CRBM" | "4º CRBM" | "5º CRBM" | "6º CRBM" | "7º CRBM" | "8º CRBM" | "9º CRBM";

function RelatorioWidget(): ReactElement {
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const data = await getRelatorio(today, today);
        setReportData(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao carregar relatório diário.';
        addNotification(message, 'error');
        console.error("Erro ao buscar relatório diário:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [addNotification]);

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo || 'Estatísticas';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  const crbmHeaders: CrbmKey[] = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

  const totals = reportData.reduce((acc, row) => {
    (Object.keys(acc) as Array<keyof typeof acc>).forEach(key => {
      acc[key] += Number(row[key as keyof IRelatorioRow]) || 0;
    });
    return acc;
  }, { diurno: 0, noturno: 0, total_capital: 0, total_geral: 0, "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0 });

  return (
    <WidgetContainer>
      <WidgetTitle>Relatório Estatístico do Dia</WidgetTitle>
      {loading ? <p>Carregando relatório...</p> : reportData.length > 0 ? (
        <TableWrapper>
          <ReportTable>
            <thead>
              <tr>
                <th rowSpan={2} style={{width: '150px', left: 0, zIndex: 4}}>GRUPO</th>
                <th rowSpan={2} style={{width: '200px', left: 150, zIndex: 4}}>NATUREZA (SUBGRUPO)</th>
                <th colSpan={3}>ESTATÍSTICA CAPITAL</th>
                <th colSpan={9}>ESTATÍSTICA POR CRBM (INTERIOR)</th>
                <th rowSpan={2}>TOTAL GERAL</th>
              </tr>
              <tr style={{ top: '40px' }}>
                <th>DIURNO</th><th>NOTURNO</th><th>TOTAL</th>
                {crbmHeaders.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  {subgrupos.map((row, index) => (
                    <tr key={`${grupo}-${row.subgrupo}`}>
                      {index === 0 && <td className="group-cell" rowSpan={subgrupos.length}>{grupo}</td>}
                      <td className="subgroup-cell">{row.subgrupo}</td>
                      <td>{row.diurno}</td><td>{row.noturno}</td><td>{row.total_capital}</td>
                      {crbmHeaders.map(h => <td key={h}>{row[h]}</td>)}
                      <td>{row.total_geral}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="total-row">
                <td colSpan={2} style={{left: 0, zIndex: 2}}>SUB TOTAL</td>
                <td>{totals.diurno}</td><td>{totals.noturno}</td><td>{totals.total_capital}</td>
                {crbmHeaders.map(h => <td key={h}>{totals[h]}</td>)}
                <td>{totals.total_geral}</td>
              </tr>
            </tbody>
          </ReportTable>
        </TableWrapper>
      ) : (
        <EmptyState>Nenhum dado para exibir no relatório do dia.</EmptyState>
      )}
    </WidgetContainer>
  );
}

export default RelatorioWidget;
