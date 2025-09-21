// frontend/src/pages/GestaoAcessoPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import {
  getSolicitacoes,
  gerenciarSolicitacao,
  ISolicitacao,
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';

function GestaoAcessoPage(): ReactElement {
  const [solicitacoes, setSolicitacoes] = useState<ISolicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendente' | 'aprovado' | 'recusado' | 'todos'>('pendente');
  const { addNotification } = useNotification();

  const fetchSolicitacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSolicitacoes();
      setSolicitacoes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar solicitações de acesso.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const handleAction = async (id: number, acao: 'aprovar' | 'recusar') => {
    // Encontra a solicitação para dar um feedback otimista
    const solicitacao = solicitacoes.find(s => s.id === id);
    if (!solicitacao) return;

    const confirmMessage = acao === 'aprovar'
      ? `Tem certeza que deseja APROVAR o acesso para ${solicitacao.nome}?`
      : `Tem certeza que deseja RECUSAR o acesso para ${solicitacao.nome}?`;

    if (window.confirm(confirmMessage)) {
      try {
        // Atualiza a UI otimistamente para uma resposta mais rápida
        setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: acao === 'aprovar' ? 'aprovado' : 'recusado' } : s));
        
        const response = await gerenciarSolicitacao(id, acao);
        addNotification(response.message, 'success');
        // A busca de dados completa pode ser feita aqui se a resposta da API for complexa
        // await fetchSolicitacoes(); 
      } catch (err) {
        const message = err instanceof Error ? err.message : `Falha ao ${acao} a solicitação.`;
        addNotification(message, 'error');
        // Reverte a UI em caso de erro
        setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: 'pendente' } : s));
      }
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    if (filter === 'todos') return true;
    return s.status === filter;
  });

  return (
    <MainLayout pageTitle="Gerenciar Solicitações de Acesso">
      {/* Controles de Filtro */}
      <div className="mb-6 flex items-center gap-4 rounded-lg bg-gray-800 p-4">
        <label htmlFor="status-filter" className="font-semibold text-gray-300">Filtrar por status:</label>
        <select
          id="status-filter"
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="rounded-md border border-gray-600 bg-gray-700 p-2 text-white"
        >
          <option value="pendente">Pendentes</option>
          <option value="aprovado">Aprovadas</option>
          <option value="recusado">Recusadas</option>
          <option value="todos">Todas</option>
        </select>
      </div>

      {/* Tabela de Solicitações */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner text="Carregando solicitações..." />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">OBM Solicitada</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Data</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
              {filteredSolicitacoes.length > 0 ? filteredSolicitacoes.map(s => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap px-6 py-4">{s.nome}</td>
                  <td className="whitespace-nowrap px-6 py-4">{s.email}</td>
                  <td className="whitespace-nowrap px-6 py-4">{s.obm_nome}</td>
                  <td className="whitespace-nowrap px-6 py-4">{new Date(s.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold
                      ${s.status === 'pendente' ? 'bg-yellow-500 text-black' : ''}
                      ${s.status === 'aprovado' ? 'bg-green-500 text-white' : ''}
                      ${s.status === 'recusado' ? 'bg-red-500 text-white' : ''}
                    `}>
                      {s.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {s.status === 'pendente' ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleAction(s.id, 'aprovar')}
                          className="rounded-md bg-green-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleAction(s.id, 'recusar')}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Recusar
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Nenhuma solicitação encontrada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}

export default GestaoAcessoPage;
