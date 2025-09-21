// Caminho: frontend/src/components/LancamentoWidget.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEstatisticasAgrupadasPorData, ICidade, IEstatisticaAgrupada } from '../services/api';
import { useData } from '../contexts/DataProvider';
import { useNotification } from '../contexts/NotificationContext';
import LancamentoTabela from './LancamentoTabela'; // Reutilizaremos a tabela existente
import Spinner from './Spinner';

// Ordem das colunas, igual à da página de Lançamento
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

function LancamentoWidget() {
  const { cidades } = useData();
  const { addNotification } = useNotification();

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [filtroCrbm, setFiltroCrbm] = useState<string>('todos');

  // Função para buscar os dados da tabela
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

  // Efeito para buscar os dados ao carregar ou quando a data muda
  useEffect(() => {
    fetchDadosTabela();
  }, [fetchDadosTabela]);

  // Lógica de filtragem, igual à da página de Lançamento
  const crbmsUnicos = useMemo(() => [...new Set(cidades.map(c => c.crbm_nome))], [cidades]);
  const cidadesFiltradas = useMemo(() => {
    if (filtroCrbm === 'todos') {
      return cidades;
    }
    return cidades.filter(c => c.crbm_nome === filtroCrbm);
  }, [cidades, filtroCrbm]);

  // A função de edição será um placeholder, pois não editaremos a partir do widget
  const handleEditPlaceholder = (cidade: ICidade) => {
    addNotification(`Para editar, acesse a página "Lançar Ocorrências" e selecione a cidade ${cidade.cidade_nome}.`, 'info');
  };

  return (
    <div className="mt-6 w-full rounded-lg bg-gray-800 p-6">
      <h3 className="mt-0 border-b border-gray-700 pb-4 text-lg font-semibold">
        Espelho de Lançamentos do Dia
      </h3>
      
      {/* Controles de Filtro */}
      <div className="my-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="data-widget" className="text-sm text-gray-400">
            Data de Visualização
          </label>
          <input
            id="data-widget"
            type="date"
            value={dataRegistro}
            onChange={e => setDataRegistro(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="filtro-crbm-widget" className="text-sm text-gray-400">
            Filtrar por CRBM
          </label>
          <select
            id="filtro-crbm-widget"
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

      {/* Reutilização do Componente da Tabela */}
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <Spinner text="Carregando espelho de lançamentos..." />
        </div>
      ) : (
        <LancamentoTabela
          dadosApi={dadosTabela}
          cidades={cidadesFiltradas}
          naturezas={ORDEM_COLUNAS}
          loading={false} // O loading já é tratado aqui no widget
          onEdit={handleEditPlaceholder} // Usamos a função placeholder
          showActions={false} // Passa a prop para esconder a coluna
        />
      )}
    </div>
  );
}

export default LancamentoWidget;
