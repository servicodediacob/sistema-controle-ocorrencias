// frontend/src/pages/GestaoAcessoPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { getSolicitacoes, gerenciarSolicitacao, ISolicitacao } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';

const SolicitacaoCard: React.FC<{ solicitacao: ISolicitacao; onAction: (id: number, acao: 'aprovar' | 'recusar') => void; statusClasses: Record<string, string>; }> = ({ solicitacao, onAction, statusClasses }) => {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-text">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-bold text-text-strong">{solicitacao.nome}</p>
          <p className="text-sm">{solicitacao.email}</p>
          <p className="text-sm text-gray-400">OBM: {solicitacao.obm_nome}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[solicitacao.status]}`}>
          {solicitacao.status}
        </span>
      </div>
      {solicitacao.status === 'pendente' && (
        <div className="mt-4 flex gap-2 border-t border-border pt-4">
          <button onClick={() => onAction(solicitacao.id, 'aprovar')} className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700">Aprovar</button>
          <button onClick={() => onAction(solicitacao.id, 'recusar')} className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Recusar</button>
        </div>
      )}
    </div>
  );
};

function GestaoAcessoPage(): ReactElement {
  const [solicitacoes, setSolicitacoes] = useState<ISolicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendente' | 'aprovado' | 'recusado' | 'todos'>('pendente');
  const { addNotification } = useNotification();

  const statusClasses = {
    pendente: 'bg-yellow-500 text-black',
    aprovado: 'bg-green-500 text-white',
    recusado: 'bg-red-500 text-white',
  };

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
    const solicitacao = solicitacoes.find(s => s.id === id);
    if (!solicitacao) return;

    const confirmMessage = acao === 'aprovar'
      ? `Tem certeza que deseja APROVAR o acesso para ${solicitacao.nome}?`
      : `Tem certeza que deseja RECUSAR o acesso para ${solicitacao.nome}?`;

    if (window.confirm(confirmMessage)) {
      try {
        setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: acao === 'aprovar' ? 'aprovado' : 'recusado' } : s));
        const response = await gerenciarSolicitacao(id, acao);
        addNotification(response.message, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : `Falha ao ${acao} a solicitação.`;
        addNotification(message, 'error');
        setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: 'pendente' } : s));
      }
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    if (filter === 'todos') return true;
    return s.status === filter;
  });

  return (
    // A prop 'pageTitle' foi removida do MainLayout
    <MainLayout>
      {/* O título agora é um elemento h1 dentro do conteúdo */}
      <h1 className="text-3xl font-bold text-text-strong mb-8">Gerenciar Solicitações de Acesso</h1>

      <div className="mb-6 flex items-center gap-4 rounded-lg bg-surface border border-border p-4">
        <label htmlFor="status-filter" className="font-semibold text-text-strong">Filtrar por status:</label>
        <select
          id="status-filter"
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="rounded-md border border-border bg-background p-2 text-text-strong"
        >
          <option value="pendente">Pendentes</option>
          <option value="aprovado">Aprovadas</option>
          <option value="recusado">Recusadas</option>
          <option value="todos">Todas</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner text="Carregando solicitações..." /></div>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-0 md:border-none md:bg-transparent">
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">OBM Solicitada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Data</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filteredSolicitacoes.length > 0 ? filteredSolicitacoes.map(s => (
                  <tr key={s.id} className="hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-text-strong">{s.nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{s.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{s.obm_nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{new Date(s.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      {s.status === 'pendente' ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleAction(s.id, 'aprovar')} className="rounded-md bg-green-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-green-700">Aprovar</button>
                          <button onClick={() => handleAction(s.id, 'recusar')} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Recusar</button>
                        </div>
                      ) : (<span className="text-gray-500">-</span>)}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhuma solicitação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredSolicitacoes.length > 0 ? (
              filteredSolicitacoes.map(s => (
                <SolicitacaoCard key={s.id} solicitacao={s} onAction={handleAction} statusClasses={statusClasses} />
              ))
            ) : (
              <p className="py-10 text-center text-gray-500">Nenhuma solicitação encontrada.</p>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default GestaoAcessoPage;
