﻿// frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import { useAuth } from '../contexts/AuthProvider';
import {
  ICidade,
  IEstatisticaAgrupada,
  getEstatisticasAgrupadasPorIntervalo as getEstatisticasAgrupadasPorData,
  limparDadosPorIntervalo as limparTodosOsDadosDoDia,
  registrarEstatisticasLote,
  IEstatisticaLotePayload,
  extractErrorMessage,
  IDataApoio,
} from '../services/api';

import {
  criarOcorrenciaDetalhada,
  atualizarOcorrenciaDetalhada,
  deletarOcorrenciaDetalhada,
  getOcorrenciasDetalhadasPorIntervalo as getOcorrenciasDetalhadas,
  IOcorrenciaDetalhadaPayload,
  IOcorrenciaDetalhada,
} from '../services/ocorrenciaDetalhadaService';

import MainLayout from '../components/MainLayout';
import LancamentoModal from '../components/LancamentoModal';
import LancamentoTabela, { NaturezaTabela } from '../components/LancamentoTabela';
import Spinner from '../components/Spinner';
import OcorrenciaDetalhadaModal from '../components/OcorrenciaDetalhadaModal';
import ViewOcorrenciaDetalhadaModal from '../components/ViewOcorrenciaDetalhadaModal';
import Icon from '../components/Icon';
import CidadesPendentesModal from '../components/CidadesPendentesModal'; // New import
import OcorrenciaDetalhadaCards from '../components/OcorrenciaDetalhadaCards'; // New component for detailed occurrence cards
import { offlineSyncService, PendingLancamento } from '../services/offlineSyncService'; // Importar serviço offline

// ======================= INÍCIO DA CORREÇÃO PRINCIPAL =======================
// 1. LISTA MESTRE: Define a ordem e as abreviações exatas, alinhadas aos nomes do banco (grupo|subgrupo).
const ORDEM_E_ABREVIACOES_COLUNAS = [
  { grupo: 'Resgate',              subgrupo: 'Resgate - Salvamento em Emergências', abreviacao: 'RESGATE' },
  { grupo: 'Incêndio',             subgrupo: 'Vegetação',                            abreviacao: 'INC. VEG' },
  { grupo: 'Incêndio',             subgrupo: 'Edificações',                          abreviacao: 'INC. EDIF' },
  { grupo: 'Incêndio',             subgrupo: 'Outros',                               abreviacao: 'INC. OUT.' },
  { grupo: 'Busca e Salvamento',   subgrupo: 'Cadáver',                              abreviacao: 'B. CADÁVER' },
  { grupo: 'Busca e Salvamento',   subgrupo: 'Diversos',                             abreviacao: 'B. SALV.' },
  { grupo: 'Ações Preventivas',    subgrupo: 'Palestras',                            abreviacao: 'AP. PAL' },
  { grupo: 'Ações Preventivas',    subgrupo: 'Eventos',                              abreviacao: 'AP. EVE' },
  { grupo: 'Ações Preventivas',    subgrupo: 'Folders/Panfletos',                    abreviacao: 'AP. FOL' },
  { grupo: 'Ações Preventivas',    subgrupo: 'Outros',                               abreviacao: 'AP. OUT.' },
  { grupo: 'Atividades Técnicas',  subgrupo: 'Inspeções',                            abreviacao: 'AT. INS' },
  { grupo: 'Atividades Técnicas',  subgrupo: 'Análise de Projetos',                  abreviacao: 'AN. PROJ' },
  { grupo: 'Produtos Perigosos',   subgrupo: 'Vazamentos',                           abreviacao: 'PPV' },
  { grupo: 'Produtos Perigosos',   subgrupo: 'Outros / Diversos',                    abreviacao: 'PPO' },
  { grupo: 'Defesa Civil',         subgrupo: 'Preventiva',                           abreviacao: 'DC PREV.' },
  { grupo: 'Defesa Civil',         subgrupo: 'De Resposta',                          abreviacao: 'DC RESP.' },
];
// ======================= FIM DA CORREÇÃO PRINCIPAL =======================


function LancamentoPage() {
  const { cidades, naturezas, loading: loadingDataApoio, triggerDataRefetch } = useData();
  const { addNotification } = useNotification();
  const { user: usuarioLogado } = useAuth();

  const isAdmin = (usuarioLogado?.role ?? '').toLowerCase() === 'admin';
  const obmPermitidaId = usuarioLogado?.obm_id ?? null;

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [ocorrenciasDetalhadas, setOcorrenciasDetalhadas] = useState<IOcorrenciaDetalhada[]>([]);
  const getInitialDates = () => {
    const formatLocalDateTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const now = new Date();
    const start = new Date(now);
    start.setHours(6, 30, 0, 0);

    // Se agora for antes das 6:30, o plantão é do dia anterior
    if (now.getHours() < 6 || (now.getHours() === 6 && now.getMinutes() < 30)) {
      start.setDate(start.getDate() - 1);
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      dataHoraInicial: formatLocalDateTime(start),
      dataHoraFinal: formatLocalDateTime(end),
    };
  };

  const [dataHoraInicial, setDataHoraInicial] = useState(getInitialDates().dataHoraInicial);
  const [dataHoraFinal, setDataHoraFinal] = useState(getInitialDates().dataHoraFinal);
  const [loadingPagina, setLoadingPagina] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<{ cidade: ICidade; dados: Record<string, number> } | null>(null);
  
  const [isDetalheModalOpen, setIsDetalheModalOpen] = useState(false);
  const [ocorrenciaParaEditar, setOcorrenciaParaEditar] = useState<IOcorrenciaDetalhada | null>(null);
  const [ocorrenciaParaVisualizar, setOcorrenciaParaVisualizar] = useState<IOcorrenciaDetalhada | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine); // Estado para status online/offline


  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // New state for mobile view

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ======================= INÍCIO DA CORREÇÃO PRINCIPAL =======================
  // 2. MAPEAMENTO: Transforma os dados da API na estrutura que a tabela precisa,
  //    usando a LISTA MESTRE para garantir a ordem e as abreviações.
  const naturezasParaTabela: NaturezaTabela[] = useMemo(() => {
    if (!naturezas || naturezas.length === 0) {
      return [];
    }

    // Cria um mapa para busca rápida: chave "grupo|subgrupo" evita ambiguidades como "Outros"
    const naturezasMap = new Map<string, IDataApoio>();
    naturezas.forEach(nat => {
      if (nat.subgrupo && nat.grupo) {
        naturezasMap.set(`${nat.grupo}|${nat.subgrupo}`, nat);
      }
    });

    // Mapeia a lista mestre para criar a lista final de colunas
    return ORDEM_E_ABREVIACOES_COLUNAS.map(itemMestre => {
      const dadosApi = naturezasMap.get(`${itemMestre.grupo}|${itemMestre.subgrupo}`);
      return {
        codigo: String(dadosApi?.id || `${itemMestre.grupo}|${itemMestre.subgrupo}`),
        nome: itemMestre.subgrupo,
        subgrupo: itemMestre.subgrupo,
        abreviacao: itemMestre.abreviacao,
        grupo: itemMestre.grupo,
      } as NaturezaTabela;
    });
  }, [naturezas]);


  const fetchDados = useCallback(async () => {
    if (!usuarioLogado || cidades.length === 0 || naturezas.length === 0) {
      return;
    }

    setLoadingPagina(true);
    try {
      const [dadosLoteApi, dadosDetalhados] = await Promise.all([
        getEstatisticasAgrupadasPorData(dataHoraInicial, dataHoraFinal),
        getOcorrenciasDetalhadas(dataHoraInicial, dataHoraFinal)
      ]);
      setDadosTabela(Array.isArray(dadosLoteApi) ? dadosLoteApi : []);
      setOcorrenciasDetalhadas(Array.isArray(dadosDetalhados) ? dadosDetalhados : []);
    } catch (error) {
      console.error('[fetchDados] Falha ao carregar dados:', error);
      addNotification('Falha ao carregar os dados da página.', 'error');
    } finally {
      setLoadingPagina(false);
    }
  }, [dataHoraInicial, dataHoraFinal, addNotification, cidades, naturezas, usuarioLogado]);

  const dadosApoioProntos = Boolean(
    usuarioLogado &&
    !loadingDataApoio &&
    cidades.length > 0 &&
    naturezas.length > 0
  );

  useEffect(() => {
    if (!dadosApoioProntos) {
      return;
    }
    fetchDados();
  }, [dadosApoioProntos, fetchDados]);

  // Efeito para gerenciar o status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);





  const obmsComDados = useMemo(() => {
    const ids = dadosTabela.map(dado => {
      const cidade = cidades.find(c => c.cidade_nome === dado.cidade_nome);
      return cidade ? cidade.id : undefined;
    }).filter((id): id is number => id !== undefined && id !== null);
    return new Set(ids);
  }, [dadosTabela, cidades]);

  const handleSaveLote = async (payload: IEstatisticaLotePayload) => {
    try {
      const response = await registrarEstatisticasLote(payload);
      addNotification(response.message, 'success');
      setIsModalOpen(false);
      setItemParaEditar(null);
      fetchDados(); // Sempre busca tudo de novo para garantir a consistência
      triggerDataRefetch(); // Notifica outros componentes que os dados foram atualizados
    } catch (error) {
      addNotification(extractErrorMessage(error), 'error');
    }
  };

  const handleSaveDetalhada = async (payload: IOcorrenciaDetalhadaPayload, id?: number) => {
    try {
      if (id) {
        await atualizarOcorrenciaDetalhada(id, payload);
        addNotification('Ocorrência atualizada com sucesso!', 'success');
      } else {
        await criarOcorrenciaDetalhada(payload);
        addNotification('Ocorrência detalhada registrada e definida como destaque!', 'success');
      }
      setIsDetalheModalOpen(false);
      setOcorrenciaParaEditar(null);
      fetchDados();
      triggerDataRefetch(); // Notifica outros componentes que os dados foram atualizados
    } catch (error) {
      addNotification(extractErrorMessage(error), 'error');
    }
  };

  const handleDeleteDetalhada = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência detalhada?')) {
      try {
        await deletarOcorrenciaDetalhada(id);
        addNotification('Ocorrência excluída com sucesso!', 'success');
        fetchDados();
      } catch (error) {
        addNotification(extractErrorMessage(error), 'error');
      }
    }
  };

  const handleLimparLancamentos = async () => {
    if (!isAdmin) {
      addNotification('Ação restrita a administradores.', 'error');
      return;
    }
    const inicio = new Date(dataHoraInicial);
    const fim = new Date(dataHoraFinal);
    const descricaoPeriodo = `${inicio.toLocaleString('pt-BR', { timeZone: 'UTC' })} até ${fim.toLocaleString('pt-BR', { timeZone: 'UTC' })}`;
    if (window.confirm(`Tem certeza que deseja limpar TODOS os lançamentos (em lote e detalhados) do período ${descricaoPeriodo}?`)) {
      try {
        setLoadingPagina(true);
        const response = await limparTodosOsDadosDoDia(dataHoraInicial, dataHoraFinal);
        addNotification(response.message, 'success');
        fetchDados();
      } catch (error) {
        addNotification(extractErrorMessage(error), 'error');
      } finally {
        setLoadingPagina(false);
      }
    }
  };

  const handleEdit = (cidade: ICidade, dadosAtuais?: Record<string, number>) => {
    if (!isAdmin && obmPermitidaId !== cidade.id) {
      addNotification('Você não tem permissão para editar os dados desta OBM.', 'error');
      return;
    }
    let dados: Record<string, number> = dadosAtuais || {};
    if (!dadosAtuais) {
      const normalize = (s: string) => s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      naturezas.forEach(nat => {
        if (nat.id) {
          const chaveNatureza = typeof nat.subgrupo === 'string' ? nat.subgrupo : '';
          const valorAgrupado = dadosTabela.find(
            d => normalize(d.cidade_nome) === normalize(cidade.cidade_nome)
              && normalize(d.natureza_nome) === normalize(chaveNatureza)
              && (!d.natureza_grupo || !nat.grupo || normalize(d.natureza_grupo) === normalize(nat.grupo))
          )?.quantidade || 0;
          dados[String(nat.id)] = valorAgrupado;
        }
      });
    }

    setItemParaEditar({ cidade, dados });
    setIsModalOpen(true);
  };

  const totalGeralLote = useMemo(() => {
    return dadosTabela.reduce((acc, item) => acc + item.quantidade, 0);
  }, [dadosTabela]);

  const cidadesComDados = useMemo(() => {
    return new Set(dadosTabela.map(d => d.cidade_nome));
  }, [dadosTabela]);

  const cidadesPendentes = cidades.length - cidadesComDados.size;
  const [isCidadesPendentesModalOpen, setIsCidadesPendentesModalOpen] = useState(false);

  if (loadingDataApoio) {
    return (
      <MainLayout pageTitle="Lançar Ocorrências">
        <div className="flex justify-center p-10">
          <Spinner text="Carregando dados de apoio..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Lançar Ocorrências">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-lg bg-surface p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="data-hora-inicial" className="text-sm text-text">
              Data/Horário Inicial
            </label>
            <input
              id="data-hora-inicial"
              type="datetime-local"
              value={dataHoraInicial}
              onChange={e => {
                const newStart = new Date(e.target.value);
                const newEnd = new Date(newStart);
                newEnd.setDate(newEnd.getDate() + 1);

                const formatLocalDateTime = (date: Date) => {
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
                };

                setDataHoraInicial(e.target.value);
                setDataHoraFinal(formatLocalDateTime(newEnd));
              }}
              className="rounded-md border border-border bg-background p-3 text-text-strong"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="data-hora-final" className="text-sm text-text">
              Data/Horário Final
            </label>
            <input
              id="data-hora-final"
              type="datetime-local"
              value={dataHoraFinal}
              onChange={e => setDataHoraFinal(e.target.value)}
              className="rounded-md border border-border bg-background p-3 text-text-strong"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {isAdmin && (
            <button
              onClick={handleLimparLancamentos}
              disabled={
                loadingPagina ||
                (dadosTabela.length === 0 && ocorrenciasDetalhadas.length === 0)
              }
              className="rounded-md bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpar Lançamentos do Dia
            </button>
          )}
          <button
            onClick={() => { setOcorrenciaParaEditar(null); setIsDetalheModalOpen(true); }}
            disabled={loadingPagina}
            className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar Ocorrência Detalhada
          </button>
          <button
            onClick={() => { setItemParaEditar(null); setIsModalOpen(true); }}
            disabled={loadingPagina}
            className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Lançamento em Lote
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <h3 className="text-sm text-text">Total de Cidades</h3>
          <p className="text-2xl font-bold text-text-strong">{cidades.length}</p>
        </div>
        <button
          onClick={() => setIsCidadesPendentesModalOpen(true)}
          className="rounded-lg border border-border bg-surface p-4 cursor-pointer hover:bg-surface-hover transition-colors"
        >
          <h3 className="text-sm text-text">Cidades Pendentes</h3>
          <p className={`text-2xl font-bold ${cidadesPendentes > 0 ? 'text-orange-500' : 'text-green-500'}`}>{cidadesPendentes}</p>
        </button>
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <h3 className="text-sm text-text">Total Geral (Lote)</h3>
          <p className="text-2xl font-bold text-teal-400">{totalGeralLote}</p>
        </div>
      </div>



      <h2 className="text-2xl font-bold text-text-strong mb-4">Lançamentos em Lote (Estatísticas)</h2>
      
      {naturezasParaTabela.length > 0 ? (
        <LancamentoTabela
          dadosApi={dadosTabela}
          cidades={cidades}
          naturezas={naturezasParaTabela}
          loading={loadingPagina}
          onEdit={handleEdit}
          showActions={Boolean(isAdmin || obmPermitidaId)}
          canEditObmId={isAdmin ? null : obmPermitidaId ?? null}
          isAdmin={isAdmin}
        />
      ) : (
        <div className="p-4 text-center text-text">
          {loadingDataApoio ? 'Carregando colunas...' : 'Não foi possível carregar a definição das colunas.'}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text-strong mb-4">Ocorrências Detalhadas do Dia</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
          {loadingPagina ? (
            <div className="flex justify-center p-10"><Spinner text="Carregando ocorrências detalhadas..." /></div>
          ) : (
            isMobile ? (
              <OcorrenciaDetalhadaCards
                ocorrencias={ocorrenciasDetalhadas}
                setOcorrenciaParaVisualizar={setOcorrenciaParaVisualizar}
                setOcorrenciaParaEditar={setOcorrenciaParaEditar}
                setIsDetalheModalOpen={setIsDetalheModalOpen}
                handleDeleteDetalhada={handleDeleteDetalhada}
              />
            ) : (
              <table className="min-w-full w-full border-collapse text-sm">
                <thead className="bg-gray-200 dark:bg-gray-700 text-text-strong">
                  <tr>
                    <th className="p-3 text-left">Horário</th>
                    <th className="p-3 text-left">Natureza</th>
                    <th className="p-3 text-left">Cidade</th>
                    <th className="p-3 text-left">Resumo</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ocorrenciasDetalhadas.length > 0 ? ocorrenciasDetalhadas.map(item => (
                    <tr key={item.id} className="border-b border-border hover:bg-border/50">
                      <td className="p-3 text-left whitespace-nowrap">{item.horario_ocorrencia?.substring(0, 5) || '--:--'}</td>
                      <td className="p-3 text-left">{item.natureza_nome}</td>
                      <td className="p-3 text-left">{item.cidade_nome}</td>
                      <td className="p-3 text-left max-w-md truncate" title={item.resumo_ocorrencia}>{item.resumo_ocorrencia}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => setOcorrenciaParaVisualizar(item)} title="Visualizar" className="text-blue-400 hover:text-blue-300">
                            <Icon path="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" size={20} />
                          </button>
                          <button onClick={() => { setOcorrenciaParaEditar(item); setIsDetalheModalOpen(true); }} title="Editar" className="text-yellow-400 hover:text-yellow-300">
                            <Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" size={20} />
                          </button>
                          <button onClick={() => handleDeleteDetalhada(item.id)} title="Excluir" className="text-red-500 hover:text-red-400">
                            <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma ocorrência detalhada lançada para esta data.</td></tr>
                  )}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {isModalOpen && (
        <LancamentoModal
          onClose={() => { setIsModalOpen(false); setItemParaEditar(null); }}
          onSave={handleSaveLote}
          cidades={cidades}
          naturezas={naturezas.filter(n => n.grupo !== 'Relatório de Óbitos')}
          itemParaEditar={itemParaEditar}
          obmsComDados={obmsComDados}
          dataFinal={dataHoraFinal}
        />
      )}

      {isDetalheModalOpen && (
        <OcorrenciaDetalhadaModal
          onClose={() => { setIsDetalheModalOpen(false); setOcorrenciaParaEditar(null); }}
          onSave={handleSaveDetalhada}
          ocorrenciaParaEditar={ocorrenciaParaEditar}
        />
      )}

      {ocorrenciaParaVisualizar && (
        <ViewOcorrenciaDetalhadaModal
          onClose={() => setOcorrenciaParaVisualizar(null)}
          ocorrencia={ocorrenciaParaVisualizar}
        />
      )}

      {isCidadesPendentesModalOpen && (
        <CidadesPendentesModal
          onClose={() => setIsCidadesPendentesModalOpen(false)}
          dataHoraInicial={dataHoraInicial}
          dataHoraFinal={dataHoraFinal}
        />
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
