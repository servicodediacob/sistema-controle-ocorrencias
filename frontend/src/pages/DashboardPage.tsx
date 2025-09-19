import { useState, useEffect, useCallback, ReactElement } from 'react';
import styled from 'styled-components';
import { getDashboardStats, getPlantao, IDashboardStats, IPlantao } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// Importe o novo MainLayout
import MainLayout from '../components/MainLayout';

import DestaqueWidget from '../components/DestaqueWidget';
import PlantaoWidget from '../components/PlantaoWidget';

// --- Styled Components (agora específicos para o conteúdo do Dashboard) ---

const FlexContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;

  /* O primeiro container não precisa de margem no topo */
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

interface StatCardProps { title: string; value: number | string; loading: boolean; }
function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardValue>{loading ? '...' : value}</CardValue>
    </Card>
  );
}

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

const Table = styled.table`
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

interface DataTableProps<T> { title: string; data: T[] | undefined; columns: { header: string; key: keyof T }[]; loading: boolean; }
function DataTable<T>({ title, data, columns, loading }: DataTableProps<T>) {
  return (
    <TableContainer>
      <TableTitle>{title}</TableTitle>
      {loading ? (
        <p>Carregando...</p>
      ) : data && data.length > 0 ? (
        <Table>
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
        </Table>
      ) : (
        <EmptyState>Nenhum dado para exibir.</EmptyState>
      )}
    </TableContainer>
  );
}

// --- Componente Principal ---
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
