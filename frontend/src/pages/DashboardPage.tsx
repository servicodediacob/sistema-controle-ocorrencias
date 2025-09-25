// frontend/src/pages/DashboardPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { getDashboardStats, getPlantao, IDashboardStats, IPlantao } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/useAuth';

import MainLayout from '../components/MainLayout';
import DestaqueWidget from '../components/DestaqueWidget';
import PlantaoWidget from '../components/PlantaoWidget';
import ObitosDoDiaWidget from '../components/ObitosDoDiaWidget';
import RelatorioWidget from '../components/RelatorioWidget';
import LancamentoWidget from '../components/LancamentoWidget';
import LoggedInUsersWidget from '../components/LoggedInUsersWidget';

// --- Componentes Funcionais (StatCard, DataTable - sem alterações) ---
interface StatCardProps {
  title: string;
  value: number | string;
  loading: boolean;
}
function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <div className="flex-1 rounded-lg bg-surface border border-border p-6 text-center min-w-[200px]">
      <h3 className="text-base font-medium text-text">{title}</h3>
      <p className="mt-2 text-4xl font-bold text-text-strong">
        {loading ? '...' : value}
      </p>
    </div>
  );
}

interface DataTableProps<T> {
  title: string;
  data: T[] | undefined;
  columns: { header: string; key: keyof T }[];
  loading: boolean;
}
function DataTable<T>({ title, data, columns, loading }: DataTableProps<T>) {
  return (
    <div className="flex-1 rounded-lg bg-surface border border-border p-6 min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        {title}
      </h3>
      {loading ? (
        <p className="py-4 text-center text-text">Carregando...</p>
      ) : data && data.length > 0 ? (
        <div className="mt-4 overflow-y-auto max-h-80">
          <table className="w-full border-collapse">
            <thead className="bg-gray-800">
              <tr>
                {columns.map((col) => (
                  <th key={String(col.key)} className="border-b border-border p-3 text-left text-sm font-medium text-text">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-700/50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="p-3 text-text-strong">{String(row[col.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-text">Nenhum dado para exibir.</p>
      )}
    </div>
  );
}

function DashboardPage(): ReactElement {
  const { addNotification } = useNotification();
  const { usuario } = useAuth();
  
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
      {/* Cards de Estatísticas */}
      <div className="flex flex-col gap-6 md:flex-row">
        <StatCard title="Total de Ocorrências" value={stats?.totalOcorrencias ?? 0} loading={loading} />
        <StatCard title="Total de Óbitos" value={stats?.totalObitos ?? 0} loading={loading} />
      </div>

      {/* Widgets de Relatórios */}
      <RelatorioWidget />
      <ObitosDoDiaWidget />
      <LancamentoWidget />

      {/* Tabelas de Dados */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
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
      </div>
      
      {/* ======================= CORREÇÃO DE ALINHAMENTO ======================= */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <DestaqueWidget destaque={plantaoData?.ocorrenciaDestaque ?? null} onUpdate={fetchData} />
        <PlantaoWidget supervisor={plantaoData?.supervisorPlantao ?? null} onUpdate={fetchData} />
        
        {usuario?.role === 'admin' && <LoggedInUsersWidget />}
      </div>
      {/* ======================= FIM DA CORREÇÃO ======================= */}
    </MainLayout>
  );
}

export default DashboardPage;
