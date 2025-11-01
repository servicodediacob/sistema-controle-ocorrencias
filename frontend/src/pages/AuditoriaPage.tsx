// Caminho: frontend/src/pages/AuditoriaPage.tsx

import { ChangeEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { getAuditoriaLogs, IAuditoriaLog, IPaginatedAuditoriaLogs } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

type DetalhesRecord = Record<string, any>;
type ProcessedLog = IAuditoriaLog & { detalhesNormalizados: DetalhesRecord };

const normalizeDetalhes = (detalhes: unknown): DetalhesRecord => {
  if (!detalhes) return {};
  if (typeof detalhes === 'string') {
    try {
      const parsed = JSON.parse(detalhes);
      if (parsed && typeof parsed === 'object') {
        return parsed as DetalhesRecord;
      }
      return { valor: parsed };
    } catch {
      return { valor: detalhes };
    }
  }
  if (typeof detalhes === 'object') {
    return detalhes as DetalhesRecord;
  }
  return { valor: detalhes };
};

const JsonViewer = ({ data }: { data: DetalhesRecord }) => {
  const formattedJson = JSON.stringify(data ?? {}, null, 2);
  return (
    <pre className="whitespace-pre-wrap rounded-md bg-background/70 p-3 text-xs text-gray-300">
      <code>{formattedJson}</code>
    </pre>
  );
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCESSO: 'Login (email/senha)',
  LOGIN_FALHA: 'Login falhou',
  LOGIN_GOOGLE_SUCESSO: 'Login Google',
  LOGIN_GOOGLE_FALHA: 'Login Google falhou',
  LOGIN_GOOGLE_PRIMEIRO_ACESSO: 'Google primeiro acesso',
  GERACAO_RELATORIO: 'Relatório gerado',
  NAVEGACAO: 'Navegação',
  CHAT_ABERTURA: 'Chat aberto',
  CHAT_FECHAMENTO: 'Chat encerrado',
  CHAT_MENSAGEM: 'Mensagem no chat',
  LIMPAR_DADOS_POR_INTERVALO: 'Limpeza de dados',
  ALTERACAO_PROPRIA_SENHA: 'Alteração de senha',
  CRIAR_OCORRENCIA_DETALHADA: 'Ocorrência criada',
  ATUALIZAR_OCORRENCIA_DETALHADA: 'Ocorrência atualizada',
  DELETAR_OCORRENCIA_DETALHADA: 'Ocorrência removida',
  CRIAR_OBITO_REGISTRO: 'Óbito registrado',
  ATUALIZAR_OBITO_REGISTRO: 'Óbito atualizado',
  DELETAR_OBITO_REGISTRO: 'Óbito removido',
  LIMPAR_REGISTROS_OBITO_POR_DATA: 'Limpeza de óbitos',
};

const formatLabel = (acao: string) =>
  ACTION_LABELS[acao] ??
  acao
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

const getActionStyle = (acao: string) => {
  if (acao.startsWith('LOGIN')) return 'border-blue-500/40 bg-blue-900/40 text-blue-100';
  if (acao.startsWith('CHAT')) return 'border-purple-500/40 bg-purple-900/40 text-purple-100';
  if (acao.includes('RELATORIO')) return 'border-emerald-500/40 bg-emerald-900/40 text-emerald-100';
  if (acao === 'NAVEGACAO') return 'border-amber-500/40 bg-amber-900/40 text-amber-100';
  if (acao.startsWith('CRIAR')) return 'border-green-500/40 bg-green-900/40 text-green-100';
  if (acao.startsWith('ATUALIZAR')) return 'border-sky-500/40 bg-sky-900/40 text-sky-100';
  if (acao.startsWith('DELETAR') || acao.startsWith('LIMPAR')) return 'border-red-500/40 bg-red-900/40 text-red-100';
  return 'border-gray-500/40 bg-gray-900/40 text-gray-100';
};

const truncate = (value: string, max = 140) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const buildResumo = (acao: string, detalhes: DetalhesRecord): string | null => {
  switch (acao) {
    case 'NAVEGACAO': {
      const path = detalhes.pathname || detalhes.path || 'rota desconhecida';
      const query = detalhes.search ? (String(detalhes.search).startsWith('?') ? detalhes.search : `?${detalhes.search}`) : '';
      return `Acessou ${path}${query}`;
    }
    case 'GERACAO_RELATORIO': {
      const tipo = detalhes.tipo || 'Relatório';
      return `Gerou o relatório "${tipo}"`;
    }
    case 'CHAT_MENSAGEM': {
      const msg = detalhes.message ? truncate(String(detalhes.message)) : 'Mensagem registrada';
      return `Mensagem para usuário ${detalhes.partnerId ?? 'N/D'}: "${msg}"`;
    }
    case 'CHAT_ABERTURA':
      return `Iniciou chat com o usuário ${detalhes.partnerId ?? 'N/D'}`;
    case 'CHAT_FECHAMENTO':
      return `Encerrou chat com o usuário ${detalhes.partnerId ?? 'N/D'}`;
    case 'LOGIN_SUCESSO':
    case 'LOGIN_GOOGLE_SUCESSO':
      return `Login concluído para ${detalhes.email ?? 'usuário desconhecido'}`;
    case 'LOGIN_GOOGLE_PRIMEIRO_ACESSO':
      return `Primeiro acesso via Google (${detalhes.email ?? 'e-mail não informado'})`;
    case 'LOGIN_FALHA':
    case 'LOGIN_GOOGLE_FALHA':
      return `Falha de login: ${detalhes.motivo ?? 'motivo desconhecido'}`;
    case 'LIMPAR_DADOS_POR_INTERVALO':
      return `Limpou registros entre ${detalhes.dataInicio ?? '?'} e ${detalhes.dataFim ?? '?'} (${detalhes.total ?? 0} itens)`;
    case 'ALTERACAO_PROPRIA_SENHA':
      return 'Alterou a própria senha.';
    default: {
      if (detalhes?.ocorrencia?.id) {
        return `Ocorrência #${detalhes.ocorrencia.id}`;
      }
      if (detalhes?.registro?.id) {
        return `Registro de óbito #${detalhes.registro.id}`;
      }
      return null;
    }
  }
};

const DetalhesCell = ({ acao, detalhes }: { acao: string; detalhes: DetalhesRecord }) => {
  const resumo = buildResumo(acao, detalhes);

  return (
    <div className="space-y-2 text-sm text-gray-200">
      {resumo && <p>{resumo}</p>}
      <details className="group text-xs text-gray-400">
        <summary className="cursor-pointer text-teal-400 transition hover:text-teal-200">Ver JSON detalhado</summary>
        <div className="mt-2">
          <JsonViewer data={detalhes} />
        </div>
      </details>
    </div>
  );
};

function AuditoriaPage(): ReactElement {
  const [data, setData] = useState<IPaginatedAuditoriaLogs>({
    logs: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [acaoFiltro, setAcaoFiltro] = useState<string>('');
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>('');
  const { addNotification } = useNotification();

  const fetchLogs = useCallback(
    async (page = 1) => {
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
    },
    [addNotification],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= data.pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const processedLogs = useMemo<ProcessedLog[]>(() => {
    return data.logs.map((log) => ({
      ...log,
      detalhesNormalizados: normalizeDetalhes(log.detalhes),
    }));
  }, [data.logs]);

  const usuarioFiltroNormalizado = usuarioFiltro.trim().toLowerCase();

  const filteredLogs = useMemo(() => {
    return processedLogs.filter((log) => {
      if (acaoFiltro && log.acao !== acaoFiltro) return false;
      if (usuarioFiltroNormalizado && !log.usuario_nome?.toLowerCase().includes(usuarioFiltroNormalizado)) return false;
      return true;
    });
  }, [processedLogs, acaoFiltro, usuarioFiltroNormalizado]);

  const uniqueActions = useMemo(() => {
    const set = new Set(data.logs.map((log) => log.acao));
    return Array.from(set).sort();
  }, [data.logs]);

  const filtrosAtivos = Boolean(acaoFiltro || usuarioFiltroNormalizado);

  const handleAcaoChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setAcaoFiltro(event.target.value);
  };

  const handleUsuarioChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsuarioFiltro(event.target.value);
  };

  const resetFiltros = () => {
    setAcaoFiltro('');
    setUsuarioFiltro('');
  };

  return (
    <MainLayout pageTitle="Logs de Auditoria">
      <div className="rounded-lg border border-border bg-surface p-4 text-text md:p-6">
        <p className="mb-6 text-sm text-gray-400">
          Esta página registra ações importantes realizadas no sistema para fins de segurança e rastreabilidade.
        </p>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-2 md:max-w-3xl">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-gray-400">Filtrar por ação</span>
              <select
                value={acaoFiltro}
                onChange={handleAcaoChange}
                className="rounded-md border border-border bg-background p-2 text-text focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Todas as ações</option>
                {uniqueActions.map((acao) => (
                  <option key={acao} value={acao}>
                    {formatLabel(acao)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-gray-400">Buscar por usuário</span>
              <input
                type="text"
                value={usuarioFiltro}
                onChange={handleUsuarioChange}
                placeholder="Nome ou e-mail"
                className="rounded-md border border-border bg-background p-2 text-text focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
          </div>

          <button
            onClick={resetFiltros}
            disabled={!filtrosAtivos}
            className="self-start rounded-md border border-teal-500/60 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/10 disabled:cursor-not-allowed disabled:border-border disabled:text-gray-500"
          >
            Limpar filtros
          </button>
        </div>

        {loading && data.logs.length === 0 ? (
          <div className="flex justify-center p-10">
            <Spinner text="Carregando logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
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
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const obmNome =
                      log.obm_nome ??
                      log.detalhesNormalizados?.obm_nome ??
                      log.detalhesNormalizados?.obm ??
                      log.detalhesNormalizados?.obmNome ??
                      'N/A';

                    return (
                      <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/40">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                          {new Date(log.criado_em).toLocaleString('pt-BR')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-text-strong">{log.usuario_nome ?? 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-text">{obmNome || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getActionStyle(
                              log.acao,
                            )}`}
                          >
                            {formatLabel(log.acao)}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <DetalhesCell acao={log.acao} detalhes={log.detalhesNormalizados} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      {filtrosAtivos
                        ? 'Nenhum log corresponde aos filtros aplicados.'
                        : 'Nenhum log de auditoria encontrado.'}
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
