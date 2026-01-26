// frontend/src/pages/DashboardPage.tsx

import { useEffect, ReactElement } from 'react';
import MainLayout from '../components/MainLayout';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import { useDashboardStats, usePlantaoData } from '../hooks/useDashboard';

// Os componentes de widget permanecem os mesmos
import DestaqueDetalhadoWidget from '../components/DestaqueDetalhadoWidget';
import ObitosDoDiaWidget from '../components/ObitosDoDiaWidget';
import RelatorioWidget from '../components/RelatorioWidget';
import LancamentoWidget from '../components/LancamentoWidget';
import LoggedInUsersWidget from '../components/LoggedInUsersWidget'; // Adicionado para completar o dashboard

// --- Componentes Funcionais (StatCard, DataTable - sem alterações) ---
interface StatCardProps {
  title: string;
  value: number | string;
  loading: boolean;
}
function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <div className="group relative flex-1 overflow-hidden rounded-sm border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all hover:border-white/20">
      {/* Glints */}
      <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 right-0 h-[20px] w-[20px] border-b border-r border-white/20"></div>

      <h3 className="mb-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">{title}</h3>

      <p className="font-orbitron text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
        {loading ? (
          <span className="animate-pulse opacity-50">...</span>
        ) : (
          <>
            {value}
            <span className="text-4xl text-neon-blue/50"></span>
          </>
        )}
      </p>

      {/* Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon-blue/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100"></div>
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
    <div className="flex-1 rounded-sm border border-white/10 bg-black/40 backdrop-blur-md min-w-[300px] flex flex-col">
      <div className="border-b border-white/5 p-4 flex justify-between items-center bg-white/5">
        <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-white">
          {title}
        </h3>
        <div className="h-1.5 w-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_#00f3ff]"></div>
      </div>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-neon-blue"></div>
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-y-auto max-h-80 custom-scrollbar pr-2">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-black/80 backdrop-blur-sm z-10">
                <tr>
                  {columns.map((col) => (
                    <th key={String(col.key)} className="pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 font-orbitron border-b border-white/10">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-rajdhani text-sm">
                {data.map((row, index) => (
                  <tr key={index} className="group transition-colors hover:bg-white/5">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="py-3 text-gray-300 group-hover:text-white transition-colors">
                        {String(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-600 font-rajdhani italic">Sem dados registrados.</p>
        )}
      </div>
    </div>
  );
}


function DashboardPage(): ReactElement {
  // React Query Hooks
  const { data: stats, isLoading: loadingStats, error: errorStats } = useDashboardStats();
  const { data: plantaoData, isLoading: loadingPlantao, error: errorPlantao } = usePlantaoData();

  const loading = loadingStats || loadingPlantao;

  // Handle errors via notification (useEffect for side effect)
  const { addNotification } = useNotification();
  useEffect(() => {
    if (errorStats) addNotification('Erro ao carregar estatísticas.', 'error');
    if (errorPlantao) addNotification('Erro ao carregar dados do plantão.', 'error');
  }, [errorStats, errorPlantao, addNotification]);

  // Refetch global when needed (optional syncing)
  const { refetch: refetchGlobalData } = useData();
  useEffect(() => {
    // If DataProvider triggers a global refetch, we might want to invalidate queries
    // For now, React Query handles its own staleTime
  }, [refetchGlobalData]);

  // Renderiza conteúdo dentro do MainLayout para usar sidebar, header e chat
  return (
    <MainLayout pageTitle="Dashboard">
      {/* Cards de Estatísticas */}
      <div className="flex flex-col gap-6 md:flex-row">
        <StatCard title="Total de Ocorrências" value={stats?.totalOcorrencias ?? 0} loading={loading} />
        <StatCard title="Total de Óbitos" value={stats?.totalObitos ?? 0} loading={loading} />
      </div>

      <DestaqueDetalhadoWidget destaques={plantaoData?.ocorrenciasDestaque || []} />

      {/* Widgets de Relatórios */}
      <RelatorioWidget />
      <ObitosDoDiaWidget />
      <LancamentoWidget />

      {/* Tabelas de Dados e Usuários Online */}
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
        <LoggedInUsersWidget />
      </div>
    </MainLayout>
  );
  // =================================================================
}

export default DashboardPage;