// Caminho: frontend/src/pages/AuditoriaPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { getAuditoriaLogs, IPaginatedAuditoriaLogs, IAuditoriaLog } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination'; // Reutilizaremos o componente de paginação

// Componente para renderizar os detalhes em JSON de forma legível
const JsonViewer: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  const formattedJson = JSON.stringify(data, null, 2);
  return (
    <pre className="whitespace-pre-wrap rounded-md bg-background p-2 text-xs text-gray-300">
      <code>{formattedJson}</code>
    </pre>
  );
};

function AuditoriaPage(): ReactElement {
  const [data, setData] = useState<IPaginatedAuditoriaLogs>({
    logs: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await getAuditoriaLogs(page, 15);
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar logs de auditoria.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= data.pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  return (
    <MainLayout pageTitle="Logs de Auditoria">
      <div className="rounded-lg border border-border bg-surface p-4 text-text md:p-6">
        <p className="mb-6 text-sm text-gray-400">
          Esta página registra ações importantes realizadas no sistema para fins de segurança e rastreabilidade.
        </p>
        
        {loading && data.logs.length === 0 ? (
          <div className="flex justify-center p-10">
            <Spinner text="Carregando logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">OBM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {data.logs.length > 0 ? data.logs.map((log: IAuditoriaLog) => (
                  <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-text-strong">{log.usuario_nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{log.obm_nome || 'N/A'}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-yellow-400">{log.acao}</td>
                    <td className="px-6 py-4">
                      <JsonViewer data={log.detalhes} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Nenhum log de auditoria encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
      </div>
    </MainLayout>
  );
}

export default AuditoriaPage;
