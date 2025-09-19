import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import { getDashboardStats, getPlantao, getRelatorio, IDashboardStats, IPlantao, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

import MainLayout from '../components/MainLayout';
import DestaqueWidget from '../components/DestaqueWidget';
import PlantaoWidget from '../components/PlantaoWidget';

// --- Styled Components ---
const FlexContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;

  &:first-of-type {
    margin-top: 0;
  }
`;

const Card = styled.div`
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  flex: 1;
  min-width: 200px;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  color: #aaa;
  margin: 0;
`;

const CardValue = styled.p`
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0.5rem 0 0 0;
`;

// --- ALTERAÇÃO: TableWrapper agora só cuida da rolagem horizontal ---
const TableWrapper = styled.div`
  overflow-x: auto; /* Permite rolagem horizontal se a tabela for muito larga */
  border: 1px solid #555;
  border-radius: 4px;
  width: 100%;
  /* A rolagem vertical foi movida para o MainLayout */
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
    top: 0; /* Vai "grudar" no topo do PageBody, que agora é o contêiner de rolagem */
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
    bottom: 0;
    z-index: 1;
  }
`;

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

const TableContainer = styled.div`
  background-color: #2c2c2c;
  border-radius: 8px;
  padding: 1.5rem;
  flex: 1;
  min-width: 300px;
`;

const TableTitle = styled.h3`
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
`;

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  border-bottom: 1px solid #555;
  padding: 0.75rem;
  text-align: left;
  color: #aaa;
`;

const Td = styled.td`
  border-bottom: 1px solid #3a3a3a;
  padding: 0.75rem;
`;

const EmptyState = styled.p`
  text-align: center;
  padding: 2rem;
  color: #888;
`;


// --- Componentes Funcionais ---

interface StatCardProps { title: string; value: number | string; loading: boolean; }
function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardValue>{loading ? '...' : value}</CardValue>
    </Card>
  );
}

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
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [addNotification]);

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo;
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
      {loading ? <p>Carregando relatório...</p> : (
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
              {/* A segunda linha do cabeçalho também é sticky, mas precisa de um deslocamento para baixo */}
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
      )}
    </WidgetContainer>
  );
}

interface DataTableProps<T> { title: string; data: T[] | undefined; columns: { header: string; key: keyof T }[]; loading: boolean; }
function DataTable<T>({ title, data, columns, loading }: DataTableProps<T>) {
  return (
    <TableContainer>
      <TableTitle>{title}</TableTitle>
      {loading ? (
        <p>Carregando...</p>
      ) : data && data.length > 0 ? (
        <SimpleTable>
          <thead>
            <tr>
              {columns.map((col) => <Th key={String(col.key)}>{col.header}</Th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => <Td key={String(col.key)}>{String(row[col.key])}</Td>)}
              </tr>
            ))}
          </tbody>
        </SimpleTable>
      ) : (
        <EmptyState>Nenhum dado para exibir.</EmptyState>
      )}
    </TableContainer>
  );
}

function DashboardPage(): ReactElement {
  const { addNotification } = useNotification();
  
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [plantaoData, setPlantaoData] = useState<IPlantao | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, plantaoInfo] = await Promise.all([
        getDashboardStats(),
        getPlantao()
      ]);
      setStats(statsData);
      setPlantaoData(plantaoInfo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar os dados do dashboard.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <MainLayout pageTitle="Dashboard do Supervisor">
      <FlexContainer>
        <DestaqueWidget destaque={plantaoData?.ocorrenciaDestaque ?? null} onUpdate={fetchData} />
        <PlantaoWidget supervisor={plantaoData?.supervisorPlantao ?? null} onUpdate={fetchData} />
      </FlexContainer>

      <FlexContainer>
        <StatCard title="Total de Ocorrências" value={stats?.totalOcorrencias ?? 0} loading={loading} />
        <StatCard title="Total de Óbitos" value={stats?.totalObitos ?? 0} loading={loading} />
      </FlexContainer>

      <FlexContainer>
        <RelatorioWidget />
      </FlexContainer>

      <FlexContainer>
        <DataTable
          title="Ocorrências por Natureza"
          loading={loading}
          data={stats?.ocorrenciasPorNatureza}
          columns={[{ header: 'Natureza', key: 'nome' }, { header: 'Total', key: 'total' }]}
        />
        <DataTable
          title="Ocorrências por CRBM"
          loading={loading}
          data={stats?.ocorrenciasPorCrbm}
          columns={[{ header: 'CRBM', key: 'nome' }, { header: 'Total', key: 'total' }]}
        />
      </FlexContainer>
    </MainLayout>
  );
}

export default DashboardPage;
