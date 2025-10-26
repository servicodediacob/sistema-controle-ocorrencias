﻿// frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import { useAuth } from '../contexts/AuthProvider';
import {
  ICidade,
  IEstatisticaAgrupada,
  getEstatisticasAgrupadasPorData,
  limparTodosOsDadosDoDia,
  registrarEstatisticasLote,
  IEstatisticaLotePayload,
  extractErrorMessage,
  IDataApoio,
} from '../services/api';

import {
  criarOcorrenciaDetalhada,
  atualizarOcorrenciaDetalhada,
  deletarOcorrenciaDetalhada,
  getOcorrenciasDetalhadas,
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
  const { cidades, naturezas, loading: loadingDataApoio } = useData();
  const { addNotification } = useNotification();
  const { user: usuarioLogado } = useAuth();

  const isAdmin = (usuarioLogado?.role ?? '').toLowerCase() === 'admin';
  const obmPermitidaId = usuarioLogado?.obm_id ?? null;

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [ocorrenciasDetalhadas, setOcorrenciasDetalhadas] = useState<IOcorrenciaDetalhada[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loadingPagina, setLoadingPagina] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<{ cidade: ICidade; dados: Record<string, number> } | null>(null);
  
  const [isDetalheModalOpen, setIsDetalheModalOpen] = useState(false);
  const [ocorrenciaParaEditar, setOcorrenciaParaEditar] = useState<IOcorrenciaDetalhada | null>(null);
  const [ocorrenciaParaVisualizar, setOcorrenciaParaVisualizar] = useState<IOcorrenciaDetalhada | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine); // Estado para status online/offline
  const [pendingOfflineLancamentos, setPendingOfflineLancamentos] = useState<PendingLancamento[]>([]); // Estado para lançamentos pendentes

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

  // Função auxiliar para mesclar dados da API com lançamentos pendentes offline
      const mergeLancamentos = useCallback(( 
        apiData: IEstatisticaAgrupada[],
        pendingData: PendingLancamento[],
        allCidades: ICidade[],
        allNaturezas: IDataApoio[]
      ): IEstatisticaAgrupada[] => {
        const mergedDataMap = new Map<string, IEstatisticaAgrupada>();  
      // Popular com dados existentes da API
      apiData.forEach(item => {
        const key = `${item.cidade_nome}|${item.natureza_nome}`; // Chave única para mesclagem
        mergedDataMap.set(key, { ...item });
      });
  
      // Mesclar dados pendentes offline
      pendingData.forEach(pending => {
        const cidade = allCidades.find(c => c.id === pending.obm_id);
        // Assumindo que cada payload de estatística tem apenas uma natureza para simplificar
        const naturezaPayload = pending.estatisticas[0]; 
        const natureza = allNaturezas.find(n => n.id === naturezaPayload.natureza_id);
  
        if (cidade && natureza) {
          const newEntry: IEstatisticaAgrupada = {
            crbm_nome: cidade.crbm_nome,
            cidade_nome: cidade.cidade_nome,
            natureza_id: natureza.id,
            natureza_grupo: natureza.grupo,
            natureza_nome: natureza.nome || natureza.subgrupo || '',
            natureza_abreviacao: natureza.abreviacao || null,
            quantidade: naturezaPayload.quantidade,
          };
  
          const key = `${newEntry.cidade_nome}|${newEntry.natureza_nome}`;
          if (mergedDataMap.has(key)) {
            // Se já existe, adiciona a quantidade
            const existing = mergedDataMap.get(key)!;
            existing.quantidade += newEntry.quantidade;
            mergedDataMap.set(key, existing);
          } else {
            // Caso contrário, adiciona como nova entrada
            mergedDataMap.set(key, newEntry);
          }
        }
      });
      console.log('[mergeLancamentos] Output - mergedDataMap:', mergedDataMap);
      return Array.from(mergedDataMap.values());
    }, [cidades, naturezas]);
  const fetchDados = useCallback(async () => {
    if (!dataRegistro || cidades.length === 0 || naturezas.length === 0) return;
    if (!usuarioLogado) return;
    setLoadingPagina(true);
    try {
      const [dadosLoteApi, dadosDetalhados] = await Promise.all([
        getEstatisticasAgrupadasPorData(dataRegistro),
        getOcorrenciasDetalhadas(dataRegistro)
      ]);
      console.log('[fetchDados] dadosLoteApi:', dadosLoteApi);
      console.log('[fetchDados] dadosDetalhados:', dadosDetalhados);

      // Carregar lançamentos pendentes para a data atual
      const lancamentosPendentesParaData = (await offlineSyncService.getPendingLancamentos(usuarioLogado?.id)).filter(
        p => p.data_registro === dataRegistro
      );
      console.log('[fetchDados] lancamentosPendentesParaData:', lancamentosPendentesParaData);

      const mergedDadosLote = mergeLancamentos(
        Array.isArray(dadosLoteApi) ? dadosLoteApi : [],
        lancamentosPendentesParaData,
        cidades,
        naturezas
      );
      console.log('[fetchDados] mergedDadosLote:', mergedDadosLote);

      setDadosTabela(mergedDadosLote);
      setOcorrenciasDetalhadas(Array.isArray(dadosDetalhados) ? dadosDetalhados : []);
    } catch (error) {
      addNotification('Falha ao carregar os dados da página.', 'error');
    } finally {
      setLoadingPagina(false);
    }
  }, [dataRegistro, addNotification, mergeLancamentos, cidades, naturezas, usuarioLogado?.id]);

  useEffect(() => {
    if (!loadingDataApoio) {
      fetchDados();
    }
  }, [fetchDados, loadingDataApoio]);

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

  // Efeito para carregar lançamentos pendentes ao montar
  useEffect(() => {
    if (usuarioLogado) {
      offlineSyncService.getPendingLancamentos(usuarioLogado.id).then(setPendingOfflineLancamentos);
    }
  }, [usuarioLogado]);

  // Função para sincronizar lançamentos offline
  const syncOfflineLancamentos = useCallback(async () => {
    if (!isOnline || !usuarioLogado || pendingOfflineLancamentos.length === 0) {
      return;
    }

    addNotification('Tentando sincronizar lançamentos offline...', 'info');
    const { success } = await offlineSyncService.syncPendingLancamentos(usuarioLogado.id);

    if (success) {
      addNotification('Lançamentos offline sincronizados com sucesso!', 'success');
      setPendingOfflineLancamentos(await offlineSyncService.getPendingLancamentos(usuarioLogado.id)); // Refresh list
      fetchDados(); // Re-fetch main data to update totals
    }
  }, [isOnline, pendingOfflineLancamentos, addNotification, fetchDados, usuarioLogado]);



  const obmsComDados = useMemo(() => {
    const ids = dadosTabela.map(dado => {
      const cidade = cidades.find(c => c.cidade_nome === dado.cidade_nome);
      return cidade ? cidade.id : undefined;
    }).filter((id): id is number => id !== undefined && id !== null);
    return new Set(ids);
  }, [dadosTabela, cidades]);

  const handleSaveLote = async (payload: IEstatisticaLotePayload) => {
    if (!isOnline) {
      try {
        if (!usuarioLogado) {
          addNotification('Você precisa estar logado para salvar dados offline.', 'error');
          return;
        }
        await offlineSyncService.savePendingLancamento(payload, usuarioLogado.id);
        setPendingOfflineLancamentos(await offlineSyncService.getPendingLancamentos(usuarioLogado.id));
        addNotification('Lançamento salvo offline. Sincronizará quando a conexão for restabelecida.', 'info');
        setIsModalOpen(false);
        setItemParaEditar(null);
        return;
      } catch (error) {
        addNotification('Falha ao salvar lançamento offline.', 'error');
        return;
      }
    }

    try {
      const response = await registrarEstatisticasLote(payload);
      addNotification(response.message, 'success');
      setIsModalOpen(false);
      setItemParaEditar(null);
      const novaData = payload.data_registro;
      if (novaData !== dataRegistro) {
        setDataRegistro(novaData);
        fetchDados(); // Se a data mudou, busca tudo de novo
      } else {
        // Atualização manual para a mesma data
        const cidade = cidades.find(c => c.id === payload.obm_id);
        if (cidade) {
          const newEntries: IEstatisticaAgrupada[] = payload.estatisticas.map(est => {
            const natureza = naturezas.find(n => n.id === est.natureza_id);
            return {
              crbm_nome: cidade.crbm_nome,
              cidade_nome: cidade.cidade_nome,
              natureza_id: est.natureza_id,
              natureza_grupo: natureza?.grupo || '',
              natureza_nome: natureza?.subgrupo || '',
              natureza_abreviacao: natureza?.abreviacao || null,
              quantidade: est.quantidade,
            };
          });

          console.log('Updating table with new entries:', newEntries);
          setDadosTabela(prevDados => {
            console.log('prevDados:', prevDados);
            const dadosAtualizados = [...prevDados];
            newEntries.forEach(newEntry => {
              const index = dadosAtualizados.findIndex(
                d => d.cidade_nome === newEntry.cidade_nome && d.natureza_nome === newEntry.natureza_nome && d.natureza_grupo === newEntry.natureza_grupo
              );
              if (index !== -1) {
                dadosAtualizados[index] = {
                  ...dadosAtualizados[index],
                  quantidade: newEntry.quantidade,
                };
              } else {
                dadosAtualizados.push(newEntry);
              }
            });
            console.log('dadosAtualizados:', dadosAtualizados);
            return dadosAtualizados;
          });
        } else {
          fetchDados(); // Fallback caso a cidade não seja encontrada
        }
      }
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
      const novaData = (payload as any).data_ocorrencia;
      if (novaData) {
        setDataRegistro(novaData);
      }
      fetchDados();
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
    const dataFormatada = new Date(dataRegistro).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    if (window.confirm(`Tem certeza que deseja limpar TODOS os lançamentos (em lote e detalhados) do dia ${dataFormatada}?`)) {
      try {
        setLoadingPagina(true);
        const response = await limparTodosOsDadosDoDia(dataRegistro);
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
            <label htmlFor="data-registro" className="text-sm text-text">
              Data de Visualização
            </label>
            <input
              id="data-registro"
              type="date"
              value={dataRegistro}
              onChange={e => setDataRegistro(e.target.value)}
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
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm text-text">Total de Cidades</h3>
          <p className="text-2xl font-bold text-text-strong">{cidades.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm text-text">Cidades Pendentes</h3>
          <p className={`text-2xl font-bold ${cidadesPendentes > 0 ? 'text-orange-500' : 'text-green-500'}`}>{cidadesPendentes}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm text-text">Total Geral (Lote)</h3>
          <p className="text-2xl font-bold text-teal-400">{totalGeralLote}</p>
        </div>
      </div>

      {pendingOfflineLancamentos.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg flex items-center justify-between">
          <span>Você tem {pendingOfflineLancamentos.length} lançamento(s) pendente(s) de sincronização.</span>
          {isOnline && (
            <button
              onClick={syncOfflineLancamentos}
              className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Sincronizar Agora
            </button>
          )}
          {!isOnline && (
            <span className="ml-4 text-sm">Aguardando conexão...</span>
          )}
        </div>
      )}

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
          dataInicial={dataRegistro}
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
    </MainLayout>
  );
}

export default LancamentoPage;