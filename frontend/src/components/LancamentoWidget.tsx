// frontend/src/components/LancamentoWidget.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
// A importação de 'ICidade' foi removida, pois não é usada diretamente aqui.
import { getEstatisticasAgrupadasPorIntervalo as getEstatisticasAgrupadasPorData, IEstatisticaAgrupada } from '../services/api';
import { useData } from '../contexts/DataProvider';
import { useNotification } from '../contexts/NotificationContext';
import LancamentoTabela from './LancamentoTabela';
import Spinner from './Spinner';

// Alinha os nomes das colunas com os subgrupos reais do banco
const ORDEM_COLUNAS: Array<{ grupo: string; subgrupo: string; abreviacao: string }> = [
    { grupo: 'Resgate',            subgrupo: 'Resgate - Salvamento em Emergências', abreviacao: 'RESGATE' },
    { grupo: 'Incêndio',           subgrupo: 'Vegetação',                            abreviacao: 'INC. VEG' },
    { grupo: 'Incêndio',           subgrupo: 'Edificações',                          abreviacao: 'INC. EDIF' },
    { grupo: 'Incêndio',           subgrupo: 'Outros',                               abreviacao: 'INC. OUT.' },
    { grupo: 'Busca e Salvamento', subgrupo: 'Cadáver',                              abreviacao: 'B. CADÁVER' },
    { grupo: 'Busca e Salvamento', subgrupo: 'Diversos',                             abreviacao: 'B. SALV.' },
    { grupo: 'Ações Preventivas',  subgrupo: 'Palestras',                            abreviacao: 'AP. PAL' },
    { grupo: 'Ações Preventivas',  subgrupo: 'Eventos',                              abreviacao: 'AP. EVE' },
    { grupo: 'Ações Preventivas',  subgrupo: 'Folders/Panfletos',                    abreviacao: 'AP. FOL' },
    { grupo: 'Ações Preventivas',  subgrupo: 'Outros',                               abreviacao: 'AP. OUT' },
    { grupo: 'Atividades Técnicas',subgrupo: 'Inspeções',                            abreviacao: 'AT. INS' },
    { grupo: 'Atividades Técnicas',subgrupo: 'Análise de Projetos',                  abreviacao: 'AN. PROJ' },
    { grupo: 'Produtos Perigosos', subgrupo: 'Vazamentos',                           abreviacao: 'PPV' }, 
    { grupo: 'Produtos Perigosos', subgrupo: 'Outros / Diversos',                    abreviacao: 'PPO' }, 
    { grupo: 'Defesa Civil',       subgrupo: 'Preventiva',                           abreviacao: 'DC PREV.' }, 
    { grupo: 'Defesa Civil',       subgrupo: 'De Resposta',                          abreviacao: 'DC RESP.' }, 
];

function LancamentoWidget() {
  const { cidades, naturezas } = useData();
  const { addNotification } = useNotification();

  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [filtroCrbm, setFiltroCrbm] = useState<string>('todos');

  const fetchDadosTabela = useCallback(async () => {
    setLoading(true);
    try {
      const dataInicio = new Date(dataRegistro);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(dataRegistro);
      dataFim.setHours(23, 59, 59, 999);

      const dados = await getEstatisticasAgrupadasPorData(dataInicio.toISOString(), dataFim.toISOString());
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

  const handleEditPlaceholder = () => {
    addNotification(`Para editar, acesse a página "Lançar Ocorrências".`, 'info');
  };

  // Converte ORDEM_COLUNAS para o formato esperado por LancamentoTabela
  const naturezasTabela = useMemo(() => {
    const normalize = (value?: string | null) =>
      (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    return ORDEM_COLUNAS.map(({ grupo, subgrupo, abreviacao }, idx) => {
      const grupoNorm = normalize(grupo);
      const subgrupoNorm = normalize(subgrupo);

      const naturezaCorrespondente = naturezas.find(
        nat => normalize(nat.grupo) === grupoNorm && normalize(nat.subgrupo) === subgrupoNorm
      );

      const codigo = naturezaCorrespondente?.id
        ? String(naturezaCorrespondente.id)
        : `${grupoNorm}|${subgrupoNorm}|${idx}`;

      return {
        codigo,
        nome: subgrupo,
        subgrupo,
        abreviacao,
        grupo,
      };
    });
  }, [naturezas]);

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
            className="rounded-md border border-border bg-background p-3 text-text-strong"
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
            className="min-w-[200px] rounded-md border border-border bg-background p-3 text-text-strong"
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
          naturezas={naturezasTabela}
          loading={false}
          onEdit={handleEditPlaceholder}
          showActions={false}
        />
      )}
    </div>
  );
}

export default LancamentoWidget;
