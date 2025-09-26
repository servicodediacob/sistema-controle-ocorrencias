// Caminho: frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import { getEstatisticasAgrupadasPorData, ICidade, IEstatisticaAgrupada, setOcorrenciaDestaque } from '../services/api'; // 1. Importar a função setOcorrenciaDestaque
import { 
  IOcorrenciaDetalhada, 
  IOcorrenciaDetalhadaPayload, 
  criarOcorrenciaDetalhada, 
  getOcorrenciasDetalhadas,
  atualizarOcorrenciaDetalhada,
  deletarOcorrenciaDetalhada
} from '../services/ocorrenciaDetalhadaService';

import MainLayout from '../components/MainLayout';
import LancamentoModal from '../components/LancamentoModal';
import LancamentoTabela from '../components/LancamentoTabela';
import Spinner from '../components/Spinner';
import OcorrenciaDetalhadaModal from '../components/OcorrenciaDetalhadaModal';
import ViewOcorrenciaDetalhadaModal from '../components/ViewOcorrenciaDetalhadaModal';
import Icon from '../components/Icon';

const ORDEM_COLUNAS = [
    { subgrupo: 'Resgate', abreviacao: 'RESGATE' },
    { subgrupo: 'Incêndio', abreviacao: 'INC. OUT.' },
    { subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
    { subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
    { subgrupo: 'Busca e Salvamento', abreviacao: 'B. SALV.' },
    { subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
    { subgrupo: 'Ações Preventivas', abreviacao: 'AP. OUT' },
    { subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
    { subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
    { subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
    { subgrupo: 'Atividades Técnicas', abreviacao: 'AT. OUT' },
    { subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
    { subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
    { subgrupo: 'Produtos Perigosos', abreviacao: 'PPV' }, 
    { subgrupo: 'Outros / Diversos', abreviacao: 'PPO' }, 
    { subgrupo: 'Preventiva', abreviacao: 'DC PREV.' }, 
    { subgrupo: 'De Resposta', abreviacao: 'DC RESP.' }, 
];

function LancamentoPage() {
  const { cidades, naturezas } = useData();
  const { addNotification } = useNotification();

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<{ cidade: ICidade; dados: Record<string, number> } | null>(null);
  
  const [isDetalheModalOpen, setIsDetalheModalOpen] = useState(false);
  const [ocorrenciasDetalhadas, setOcorrenciasDetalhadas] = useState<IOcorrenciaDetalhada[]>([]);
  const [loadingDetalhadas, setLoadingDetalhadas] = useState(true);
  
  const [ocorrenciaParaEditar, setOcorrenciaParaEditar] = useState<IOcorrenciaDetalhada | null>(null);
  const [ocorrenciaParaVisualizar, setOcorrenciaParaVisualizar] = useState<IOcorrenciaDetalhada | null>(null);

  const fetchDadosTabela = useCallback(async () => {
    if (!dataRegistro) return;
    setLoading(true);
    try {
      const dados = await getEstatisticasAgrupadasPorData(dataRegistro);
      setDadosTabela(dados);
    } catch (error) {
      addNotification('Falha ao carregar lançamentos em lote.', 'error');
    } finally {
      setLoading(false);
    }
  }, [dataRegistro, addNotification]);

  const fetchOcorrenciasDetalhadas = useCallback(async () => {
    if (!dataRegistro) return;
    setLoadingDetalhadas(true);
    try {
      const dados = await getOcorrenciasDetalhadas(dataRegistro);
      setOcorrenciasDetalhadas(dados);
    } catch (error) {
      addNotification('Falha ao carregar ocorrências detalhadas.', 'error');
    } finally {
      setLoadingDetalhadas(false);
    }
  }, [dataRegistro, addNotification]);

  useEffect(() => {
    fetchDadosTabela();
    fetchOcorrenciasDetalhadas();
  }, [fetchDadosTabela, fetchOcorrenciasDetalhadas]);

  const obmsComDados = useMemo(() => {
    const ids = dadosTabela.map(dado => {
      const cidade = cidades.find(c => c.cidade_nome === dado.cidade_nome);
      return cidade ? cidade.id : null;
    }).filter((id): id is number => id !== null);
    return new Set(ids);
  }, [dadosTabela, cidades]);

  const handleSaveDetalhada = async (payload: IOcorrenciaDetalhadaPayload, id?: number) => {
    try {
      if (id) {
        await atualizarOcorrenciaDetalhada(id, payload);
        addNotification('Ocorrência atualizada com sucesso!', 'success');
      } else {
        await criarOcorrenciaDetalhada(payload);
        addNotification('Ocorrência detalhada registrada com sucesso!', 'success');
      }
      setIsDetalheModalOpen(false);
      setOcorrenciaParaEditar(null);
      fetchOcorrenciasDetalhadas();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar a ocorrência.';
      addNotification(message, 'error');
    }
  };

  const handleDeleteDetalhada = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência detalhada?')) {
      try {
        await deletarOcorrenciaDetalhada(id);
        addNotification('Ocorrência excluída com sucesso!', 'success');
        fetchOcorrenciasDetalhadas();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao excluir a ocorrência.';
        addNotification(message, 'error');
      }
    }
  };

  // ======================= INÍCIO DA CORREÇÃO =======================
  // 2. Nova função para lidar com o clique no botão de destaque
  const handleSetDestaque = async (id: number) => {
    if (window.confirm(`Tem certeza que deseja definir a ocorrência ID ${id} como destaque?`)) {
      try {
        await setOcorrenciaDestaque(id);
        addNotification(`Ocorrência ${id} definida como destaque!`, 'success');
        // Não é necessário refetch, pois o destaque é exibido em outra página
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao definir destaque.';
        addNotification(message, 'error');
      }
    }
  };
  // ======================= FIM DA CORREÇÃO =======================

  const handleEdit = (cidade: ICidade, dadosAtuais: Record<string, number>) => {
    setItemParaEditar({ cidade, dados: dadosAtuais });
    setIsModalOpen(true);
  };

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
              className="rounded-md border border-border bg-surface p-3 text-text-strong"
            />
          </div>
        </div>
        
        <div className="flex items-end gap-4">
          <button
            onClick={() => { setOcorrenciaParaEditar(null); setIsDetalheModalOpen(true); }}
            disabled={loading}
            className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar Ocorrência Detalhada
          </button>
          <button
            onClick={() => { setItemParaEditar(null); setIsModalOpen(true); }}
            disabled={loading}
            className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Lançamento em Lote
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-text-strong mb-4">Lançamentos em Lote (Estatísticas)</h2>
      <LancamentoTabela
        dadosApi={dadosTabela}
        cidades={cidades}
        naturezas={ORDEM_COLUNAS}
        loading={loading}
        onEdit={handleEdit}
      />

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text-strong mb-4">Ocorrências Detalhadas do Dia</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
          {loadingDetalhadas ? (
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
                        {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
                        {/* 3. Adicionar o novo botão de Destaque */}
                        <button onClick={() => handleSetDestaque(item.id)} title="Definir como Destaque" className="text-purple-400 hover:text-purple-300">
                          <Icon path="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" size={20} />
                        </button>
                        {/* ======================= FIM DA CORREÇÃO ======================= */}
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
          onSave={() => { /* Lógica de salvar em lote */ }}
          cidades={cidades}
          naturezas={naturezas.filter(n => n.grupo !== 'Relatório de Óbitos')}
          itemParaEditar={itemParaEditar}
          obmsComDados={obmsComDados}
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
          ocorrencia={ocorrenciaParaVisualizar}
          onClose={() => setOcorrenciaParaVisualizar(null)}
        />
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
