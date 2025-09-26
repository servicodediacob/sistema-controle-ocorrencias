// Caminho: frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ICidade,
  getEstatisticasAgrupadasPorData,
  IEstatisticaAgrupada,
} from '../services/api';
// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Importar do novo serviço dedicado
import {
  IOcorrenciaDetalhada,
  IOcorrenciaDetalhadaPayload,
  criarOcorrenciaDetalhada,
  getOcorrenciasDetalhadas
} from '../services/ocorrenciaDetalhadaService';
// ======================= FIM DA CORREÇÃO =======================
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import MainLayout from '../components/MainLayout';
import LancamentoModal from '../components/LancamentoModal';
import LancamentoTabela from '../components/LancamentoTabela';
import Spinner from '../components/Spinner';
import OcorrenciaDetalhadaModal from '../components/OcorrenciaDetalhadaModal';

// ... (const ORDEM_COLUNAS e o resto do componente permanecem os mesmos)
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
    { subgrupo: 'Produtos Perigosos', abreviacao: 'PPO' },
    { subgrupo: 'Vazamentos', abreviacao: 'PPV' },
    { subgrupo: 'Defesa Civil', abreviacao: 'DC OUT' },
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

  const colunasNatureza = ORDEM_COLUNAS;

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

  const handleSaveDetalhada = async (payload: IOcorrenciaDetalhadaPayload) => {
    try {
      await criarOcorrenciaDetalhada(payload);
      addNotification('Ocorrência detalhada registrada com sucesso!', 'success');
      setIsDetalheModalOpen(false);
      fetchOcorrenciasDetalhadas();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar a ocorrência.';
      addNotification(message, 'error');
    }
  };

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
            onClick={() => setIsDetalheModalOpen(true)}
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
        naturezas={colunasNatureza}
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
                </tr>
              </thead>
              <tbody>
                {ocorrenciasDetalhadas.length > 0 ? ocorrenciasDetalhadas.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-border/50">
                    <td className="p-3 text-left whitespace-nowrap">{item.horario_ocorrencia?.substring(0, 5) || '--:--'}</td>
                    <td className="p-3 text-left">{item.natureza_nome}</td>
                    <td className="p-3 text-left">{item.cidade_nome}</td>
                    <td className="p-3 text-left max-w-md truncate" title={item.resumo_ocorrencia}>{item.resumo_ocorrencia}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma ocorrência detalhada lançada para esta data.</td></tr>
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
          onClose={() => setIsDetalheModalOpen(false)}
          onSave={handleSaveDetalhada}
        />
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
