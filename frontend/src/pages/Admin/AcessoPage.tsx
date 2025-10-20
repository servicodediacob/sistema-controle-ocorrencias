// frontend/src/pages/Admin/AcessoPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { getSolicitacoes, gerenciarSolicitacao, ISolicitacao } from '../../services/api';
import { extractErrorMessage } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import MainLayout from '../../components/MainLayout';
import { format } from 'date-fns';

const AcessoPage = () => {
  const [solicitacoes, setSolicitacoes] = useState<ISolicitacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotification();

  const fetchSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSolicitacoes();
      setSolicitacoes(data);
      setError(null);
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const handleGerenciar = async (id: number, acao: 'aprovar' | 'recusar') => {
    try {
      const res = await gerenciarSolicitacao(id, acao);
      addNotification(res.message, 'success');
      // Re-fetch the list to show the change
      fetchSolicitacoes();
    } catch (err) {
      const message = extractErrorMessage(err);
      addNotification(message, 'error');
    }
  };

  const pendentes = solicitacoes.filter(s => s.status === 'pendente');
  const historico = solicitacoes.filter(s => s.status !== 'pendente');

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Gerenciamento de Acesso</h1>

        {/* Seção de Solicitações Pendentes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Solicitações Pendentes</h2>
          {loading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && pendentes.length === 0 && <p>Nenhuma solicitação pendente.</p>}
          {!loading && !error && pendentes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4 text-left">Nome</th>
                    <th className="py-2 px-4 text-left">Email</th>
                    <th className="py-2 px-4 text-left">OBM Solicitada</th>
                    <th className="py-2 px-4 text-left">Data</th>
                    <th className="py-2 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 px-4">{s.nome}</td>
                      <td className="py-2 px-4">{s.email}</td>
                      <td className="py-2 px-4">{s.obm_nome}</td>
                      <td className="py-2 px-4">{format(new Date(s.data_solicitacao), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleGerenciar(s.id, 'aprovar')}
                          className="bg-green-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleGerenciar(s.id, 'recusar')}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                        >
                          Recusar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção de Histórico */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-semibold mb-4">Histórico de Solicitações</h2>
          {historico.length === 0 && <p>Nenhum histórico de solicitações.</p>}
          {historico.length > 0 && (
             <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4 text-left">Nome</th>
                    <th className="py-2 px-4 text-left">Email</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 px-4">{s.nome}</td>
                      <td className="py-2 px-4">{s.email}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'aprovado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">{format(new Date(s.data_solicitacao), 'dd/MM/yyyy HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AcessoPage;
