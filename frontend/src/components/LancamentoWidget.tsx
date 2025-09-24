// Caminho: frontend/src/components/LancamentoWidget.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEstatisticasAgrupadasPorData, ICidade, IEstatisticaAgrupada } from '../services/api';
import { useData } from '../contexts/DataProvider';
import { useNotification } from '../contexts/NotificationContext';
import LancamentoTabela from './LancamentoTabela';
import Spinner from './Spinner';

// ======================= CORREÇÃO APLICADA =======================
// A constante ORDEM_COLUNAS foi adicionada de volta ao arquivo.
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
    { subgrupo: 'Produtos Perigosos', abreviacao: 'PPV' }, 
    { subgrupo: 'Outros / Diversos', abreviacao: 'PPO' }, 
    { subgrupo: 'Preventiva', abreviacao: 'DC PREV.' }, 
    { subgrupo: 'De Resposta', abreviacao: 'DC RESP.' }, 
];
// ======================= FIM DA CORREÇÃO =======================

function LancamentoWidget() {
  const { cidades } = useData();
  const { addNotification } = useNotification();

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [filtroCrbm, setFiltroCrbm] = useState<string>('todos');

  const fetchDadosTabela = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await getEstatisticasAgrupadasPorData(dataRegistro);
      setDadosTabela(dados);
    } catch (error) {
      addNotification('Falha ao carregar lançamentos do dia para o widget.', 'error');
    } finally {
      setLoading(false);
    }
  }, [dataRegistro, addNotification]);

  useEffect(() => {
    fetchDadosTabela();
  }, [fetchDadosTabela]);

  const crbmsUnicos = useMemo(() => [...new Set(cidades.map(c => c.crbm_nome))], [cidades]);
  const cidadesFiltradas = useMemo(() => {
    if (filtroCrbm === 'todos') {
      return cidades;
    }
    return cidades.filter(c => c.crbm_nome === filtroCrbm);
  }, [cidades, filtroCrbm]);

  const handleEditPlaceholder = (cidade: ICidade) => {
    addNotification(`Para editar, acesse a página "Lançar Ocorrências" e selecione a cidade ${cidade.cidade_nome}.`, 'info');
  };

  return (
    <div className="mt-6 w-full rounded-lg bg-surface border border-border p-6 text-text">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Espelho de Lançamentos do Dia
      </h3>
      
      <div className="my-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="data-widget" className="text-sm text-text">
            Data de Visualização
          </label>
          <input
            id="data-widget"
            type="date"
            value={dataRegistro}
            onChange={e => setDataRegistro(e.target.value)}
            className="rounded-md border border-border bg-surface p-3 text-text-strong"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="filtro-crbm-widget" className="text-sm text-text">
            Filtrar por CRBM
          </label>
          <select
            id="filtro-crbm-widget"
            value={filtroCrbm}
            onChange={e => setFiltroCrbm(e.target.value)}
            className="min-w-[200px] rounded-md border border-border bg-surface p-3 text-text-strong"
          >
            <option value="todos">Todos os CRBMs</option>
            {crbmsUnicos.map(crbm => (
              <option key={crbm} value={crbm}>{crbm}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-10">
          <Spinner text="Carregando espelho de lançamentos..." />
        </div>
      ) : (
        <LancamentoTabela
          dadosApi={dadosTabela}
          cidades={cidadesFiltradas}
          naturezas={ORDEM_COLUNAS}
          loading={false}
          onEdit={handleEditPlaceholder}
          showActions={false}
        />
      )}
    </div>
  );
}

export default LancamentoWidget;
