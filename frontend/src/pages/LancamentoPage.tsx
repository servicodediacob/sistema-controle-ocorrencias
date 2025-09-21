// frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ICidade,
  registrarEstatisticasLote,
  getEstatisticasAgrupadasPorData,
  IEstatisticaAgrupada,
  limparEstatisticasDoDia
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataProvider';
import MainLayout from '../components/MainLayout';
import LancamentoModal from '../components/LancamentoModal';
import LancamentoTabela from '../components/LancamentoTabela';

const ORDEM_COLUNAS: Array<{ subgrupo: string; abreviacao: string }> = [
    { subgrupo: 'Resgate', abreviacao: 'RESGATE' },
    { subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
    { subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
    { subgrupo: 'Incêndio - Outros', abreviacao: 'INC. OUT.' },
    { subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
    { subgrupo: 'Busca e Salvamento - Diversos', abreviacao: 'B. SALV.' },
    { subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
    { subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
    { subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
    { subgrupo: 'Outros', abreviacao: 'AP. OUT' },
    { subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
    { subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
    { subgrupo: 'Vazamentos', abreviacao: 'PPV' },
    { subgrupo: 'Outros / Diversos', abreviacao: 'PPO' },
    { subgrupo: 'Preventiva', abreviacao: 'DC PREV.' },
    { subgrupo: 'De Resposta', abreviacao: 'DC RESP.' },
];

function LancamentoPage() {
  const { cidades, naturezas } = useData();
  const { addNotification } = useNotification();

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const colunasNatureza = ORDEM_COLUNAS;

  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<{ cidade: ICidade; dados: Record<string, number> } | null>(null);
  
  const [filtroCrbm, setFiltroCrbm] = useState<string>('todos');

  const fetchDadosTabela = useCallback(async () => {
    if (!dataRegistro) return;
    setLoading(true);
    try {
      const dados = await getEstatisticasAgrupadasPorData(dataRegistro);
      setDadosTabela(dados);
    } catch (error) {
      addNotification('Falha ao carregar lançamentos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [dataRegistro, addNotification]);

  useEffect(() => {
    fetchDadosTabela();
  }, [fetchDadosTabela]);

  const handleSave = async (formData: any) => {
    // ======================= INÍCIO DA CORREÇÃO =======================
    // O payload agora usa 'obm_id' em vez de 'cidade_id' para corresponder à interface.
    // O valor vem de formData.cidade_id, que é o ID da OBM selecionada no modal.
    const payload = {
      data_registro: formData.data_ocorrencia,
      obm_id: formData.cidade_id, // <-- CORREÇÃO APLICADA AQUI
      estatisticas: Object.entries(formData.quantidades)
        .map(([natureza_id, quantidadeStr]) => ({
          natureza_id: parseInt(natureza_id, 10),
          quantidade: parseInt(quantidadeStr as string, 10) || 0,
        }))
        .filter(({ quantidade }) => quantidade > 0),
    };
    // ======================= FIM DA CORREÇÃO =======================

    if (payload.estatisticas.length === 0 && !itemParaEditar) {
      addNotification('Nenhum valor foi preenchido.', 'info');
      return;
    }

    try {
      if (itemParaEditar) {
        // A função limparEstatisticasDoDia espera o ID da OBM (cidade)
        await limparEstatisticasDoDia(payload.data_registro, payload.obm_id);
      }
      
      const response = await registrarEstatisticasLote(payload);
      addNotification(itemParaEditar ? 'Lançamentos atualizados com sucesso!' : response.message, 'success');
      
      setIsModalOpen(false);
      setItemParaEditar(null);
      fetchDadosTabela();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar os dados.';
      addNotification(message, 'error');
    }
  };

  const handleEdit = (cidade: ICidade, dadosAtuais: Record<string, number>) => {
    setItemParaEditar({ cidade, dados: dadosAtuais });
    setIsModalOpen(true);
  };

  const handleLimparTabela = async () => {
    const dataFormatada = new Date(dataRegistro).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    if (window.confirm(`Tem certeza que deseja excluir TODOS os lançamentos do dia ${dataFormatada}? Esta ação não pode ser desfeita.`)) {
      try {
        setLoading(true);
        await limparEstatisticasDoDia(dataRegistro);
        addNotification('Todos os registros do dia foram excluídos.', 'success');
        fetchDadosTabela();
      } catch (error) {
        addNotification('Falha ao limpar os registros.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const crbmsUnicos = useMemo(() => [...new Set(cidades.map(c => c.crbm_nome))], [cidades]);

  const cidadesFiltradas = useMemo(() => {
    if (filtroCrbm === 'todos') {
      return cidades;
    }
    return cidades.filter(c => c.crbm_nome === filtroCrbm);
  }, [cidades, filtroCrbm]);

  return (
    <MainLayout pageTitle="Formulário de Lançamento de Ocorrências">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="data-registro" className="text-sm text-gray-400">
              Data de Visualização
            </label>
            <input
              id="data-registro"
              type="date"
              value={dataRegistro}
              onChange={e => setDataRegistro(e.target.value)}
              className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="filtro-crbm" className="text-sm text-gray-400">
              Filtrar por CRBM
            </label>
            <select
              id="filtro-crbm"
              value={filtroCrbm}
              onChange={e => setFiltroCrbm(e.target.value)}
              className="min-w-[200px] rounded-md border border-gray-600 bg-gray-700 p-3 text-white"
            >
              <option value="todos">Todos os CRBMs</option>
              {crbmsUnicos.map(crbm => (
                <option key={crbm} value={crbm}>{crbm}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-end gap-4">
          <button
            onClick={handleLimparTabela}
            disabled={loading || dadosTabela.length === 0}
            className="rounded-md bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpar Plantão
          </button>
          <button
            onClick={() => { setItemParaEditar(null); setIsModalOpen(true); }}
            disabled={cidades.length === 0}
            className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar Lançamento
          </button>
        </div>
      </div>

      <LancamentoTabela
        dadosApi={dadosTabela}
        cidades={cidadesFiltradas}
        naturezas={colunasNatureza}
        loading={loading}
        onEdit={handleEdit}
      />

      {isModalOpen && (
        <LancamentoModal
          onClose={() => { setIsModalOpen(false); setItemParaEditar(null); }}
          onSave={handleSave}
          cidades={cidades}
          naturezas={naturezas.filter(n => n.grupo !== 'Relatório de Óbitos')}
          itemParaEditar={itemParaEditar}
        />
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
