// frontend/src/components/LancamentoTabela.tsx

import React, { useState, useMemo } from 'react';
import { IEstatisticaAgrupada, ICidade } from '../services/api';
import Icon from './Icon';
import SkeletonTable from './SkeletonTable';

export interface NaturezaTabela {
  codigo: string;
  nome: string;
  subgrupo?: string;
  abreviacao?: string | null;
  grupo?: string;
}

interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: NaturezaTabela[];
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions?: boolean;
  canEditObmId?: number | null;
  isAdmin?: boolean;
}

// --- MobileCard e CrbmAccordion permanecem os mesmos ---
interface CardProps {
  cidade: ICidade;
  ocorrencias: Record<string, number>;
  total: number;
  onEdit: () => void;
  showActions: boolean;
}

const MobileCard: React.FC<CardProps> = ({ cidade, ocorrencias, total, onEdit, showActions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasData = total > 0;

  const cardClasses = hasData 
    ? 'border-green-700/50 dark:bg-green-900/20 bg-green-50' 
    : 'border-red-800/50 dark:bg-red-900/20 bg-red-50';
  const totalColor = hasData ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className={`rounded-lg border ${cardClasses}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <p className="font-bold text-text-strong">{cidade.cidade_nome}</p>
          <p className="text-sm text-text">{cidade.crbm_nome}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text">Total</p>
          <p className={`text-xl font-bold ${totalColor}`}>{total}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(ocorrencias).map(([natureza, qtd]) => (
              qtd > 0 && (
                <div key={natureza} className="flex justify-between border-b border-dashed border-border py-1">
                  <span className="text-text">{natureza}</span>
                  <span className="font-semibold text-text-strong">{qtd}</span>
                </div>
              )
            ))}
          </div>
          {showActions && (
            <button
              onClick={onEdit}
              className="mt-4 w-full rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
            >
              Editar Lançamento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface CrbmAccordionProps {
  crbmNome: string;
  cidadesDoCrbm: ICidade[];
  dadosMapa: Record<string, number>;
  naturezas: NaturezaTabela[];
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions: boolean;
  canEditObmId?: number | null;
  isAdmin?: boolean;
}

const CrbmAccordion: React.FC<CrbmAccordionProps> = ({ crbmNome, cidadesDoCrbm, dadosMapa, naturezas, onEdit, showActions, canEditObmId, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  // helpers locais
  const normalizeStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const keyForLocal = (cidadeNome: string, codigo: string) => `${normalizeStr(cidadeNome)}|${codigo}`;

  const totalCrbm = useMemo(() => {
    return cidadesDoCrbm.reduce((acc, cidade) => {
      return acc + naturezas.reduce((cityAcc, nat) => {
        return cityAcc + (dadosMapa[keyForLocal(cidade.cidade_nome, nat.codigo)] || 0);
      }, 0);
    }, 0);
  }, [cidadesDoCrbm, dadosMapa, naturezas]);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon 
            path="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
            className={`transform text-text-strong transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
          />
          <p className="font-bold text-text-strong">{crbmNome}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text">Total</p>
          <p className={`text-xl font-bold ${totalCrbm > 0 ? 'text-blue-400' : 'text-text'}`}>{totalCrbm}</p>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2 border-t border-border p-4">
          {cidadesDoCrbm.map(cidade => {
            const podeEditarCidade = !!(isAdmin || (canEditObmId !== undefined && canEditObmId !== null && canEditObmId === cidade.id));
            const ocorrencias: Record<string, number> = {};
            let totalLinha = 0;
            naturezas.forEach(nat => {
              const qtd = dadosMapa[keyForLocal(cidade.cidade_nome, nat.codigo)] || 0;
              if (qtd > 0 && nat.abreviacao) {
                ocorrencias[nat.abreviacao] = qtd;
              }
              totalLinha += qtd;
            });
            
            const dadosParaEdicao = naturezas.reduce((acc, nat) => {
                acc[nat.codigo] = dadosMapa[keyForLocal(cidade.cidade_nome, nat.codigo)] || 0;
                return acc;
            }, {} as Record<string, number>);

            return (
              <MobileCard
                key={`mobile-${cidade.id}`}
                cidade={cidade}
                ocorrencias={ocorrencias}
                total={totalLinha}
                onEdit={() => onEdit(cidade, dadosParaEdicao)}
                showActions={Boolean(showActions && podeEditarCidade)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
// --- Fim dos componentes Mobile ---


const LancamentoTabela: React.FC<LancamentoTabelaProps> = ({ 
  dadosApi,
  cidades,
  naturezas,
  loading,
  onEdit,
  showActions = true,
  canEditObmId = null,
  isAdmin = false,
}) => {
  if (loading) {
    return <SkeletonTable data-testid="skeleton-table" />;
  }

  // Normaliza??o e mapeamentos robustos para evitar diverg?ncias
  const normalize = (s: string) => s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const keyFor = (cidadeNome: string, codigo: string) => `${normalize(cidadeNome)}|${codigo}`;

  // Mapas auxiliares para resolu??o por nome e por par grupo|subgrupo
  const naturezaNomeParaCodigo = useMemo(() =>
    naturezas.reduce((acc, nat) => {
      const nomeNorm = normalize(nat.nome);
      if (nomeNorm) acc[nomeNorm] = nat.codigo;

      if (nat.subgrupo) {
        const subNorm = normalize(nat.subgrupo);
        acc[subNorm] = nat.codigo;
        if (nat.grupo) {
          const grupoNorm = normalize(nat.grupo);
          acc[`${grupoNorm}|${subNorm}`] = nat.codigo;
          acc[`${grupoNorm} - ${subNorm}`] = nat.codigo;
        }
      }

      return acc;
    }, {} as Record<string, string>)
  , [naturezas]);

  const naturezaAbrevParaCodigo = useMemo(() =>
    naturezas.reduce((acc, nat) => {
      if (nat.abreviacao) acc[normalize(nat.abreviacao)] = nat.codigo;
      return acc;
    }, {} as Record<string, string>)
  , [naturezas]);

  const codigosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    naturezas.forEach((nat) => {
      if (nat.codigo !== undefined && nat.codigo !== null) {
        set.add(String(nat.codigo));
      }
    });
    return set;
  }, [naturezas]);

  const dadosMapa = useMemo(() => {
    return dadosApi.reduce((acc: Record<string, number>, item: IEstatisticaAgrupada) => {
      // Preferimos o ID da natureza para evitar ambiguidades (ex.: "Outros").
      const codigoFromId = item.natureza_id ? String(item.natureza_id) : undefined;
      let codigo: string | undefined = (codigoFromId && codigosDisponiveis.has(codigoFromId)) ? codigoFromId : undefined;

      if (!codigo) {
        const nomeChave = normalize(item.natureza_nome);
        const partesNome = nomeChave.split('-').map(parte => parte.trim()).filter(Boolean);
        const subgrupoNormalizado = partesNome.length > 1 ? partesNome[partesNome.length - 1] : nomeChave;
        const grupoNormalizado = item.natureza_grupo ? normalize(item.natureza_grupo) : undefined;
        const abrevChave = item.natureza_abreviacao ? normalize(item.natureza_abreviacao) : '';
        const grupoSubChave = grupoNormalizado ? `${grupoNormalizado}|${subgrupoNormalizado}` : '';
        const grupoNomeComposto = grupoNormalizado ? `${grupoNormalizado} - ${subgrupoNormalizado}` : '';

        codigo =
          naturezaNomeParaCodigo[nomeChave] ||
          naturezaNomeParaCodigo[subgrupoNormalizado] ||
          naturezaNomeParaCodigo[grupoSubChave] ||
          naturezaNomeParaCodigo[grupoNomeComposto] ||
          (abrevChave ? naturezaAbrevParaCodigo[abrevChave] : undefined);
      }

      if (codigo) {
        const key = keyFor(item.cidade_nome, codigo);
        acc[key] = (acc[key] || 0) + item.quantidade;
      }
      return acc;
    }, {});
  }, [dadosApi, naturezaNomeParaCodigo, naturezaAbrevParaCodigo]);

  const cidadesAgrupadas = useMemo(() => {
    return cidades.reduce((acc: Record<string, ICidade[]>, cidade: ICidade) => {
      const crbm = cidade.crbm_nome;
      if (!acc[crbm]) acc[crbm] = [];
      acc[crbm].push(cidade);
      return acc;
    }, {});
  }, [cidades]);

  const totais = useMemo(() => {
    const totaisCrbm: Record<string, Record<string, number>> = {};
    const totaisGeral: Record<string, number> = {};

    naturezas.forEach(nat => {
      totaisGeral[nat.codigo] = 0;
    });
    totaisGeral['TOTAL'] = 0;

    Object.keys(cidadesAgrupadas).forEach(crbm => {
      totaisCrbm[crbm] = {};
      naturezas.forEach(nat => {
        totaisCrbm[crbm][nat.codigo] = 0;
      });
      totaisCrbm[crbm]['TOTAL'] = 0;
    });

    for (const crbmNome in cidadesAgrupadas) {
      let totalCrbm = 0;
      cidadesAgrupadas[crbmNome].forEach(cidade => {
        let totalCidade = 0;
        naturezas.forEach(nat => {
          const qtd = dadosMapa[keyFor(cidade.cidade_nome, nat.codigo)] || 0;
          totaisCrbm[crbmNome][nat.codigo] = (totaisCrbm[crbmNome][nat.codigo] || 0) + qtd;
          totaisGeral[nat.codigo] = (totaisGeral[nat.codigo] || 0) + qtd;
          totalCidade += qtd;
        });
        totalCrbm += totalCidade;
      });
      totaisCrbm[crbmNome]['TOTAL'] = totalCrbm;
      totaisGeral['TOTAL'] += totalCrbm;
    }

    return { crbm: totaisCrbm, geral: totaisGeral };
  }, [cidades, naturezas, dadosMapa, cidadesAgrupadas]);

  return (
    <>
      <div className="mt-4 space-y-4 md:hidden">
        {Object.entries(cidadesAgrupadas).map(([crbmNome, cidadesDoCrbm]) => (
          <CrbmAccordion
            key={crbmNome}
            crbmNome={crbmNome}
            cidadesDoCrbm={cidadesDoCrbm}
            dadosMapa={dadosMapa}
            naturezas={naturezas}
            onEdit={onEdit}
            showActions={showActions}
            canEditObmId={canEditObmId}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <div className="mt-8 hidden rounded-lg border border-border bg-surface text-text md:block max-h-[75vh] overflow-y-auto relative">
        <table className="w-full border-collapse table-fixed text-xs">
          <thead className="bg-gray-800 text-white uppercase text-xs font-bold">
            <tr>
              <th className="sticky left-0 top-0 z-30 w-[150px] border-b-2 border-r border-gray-700 bg-gray-800 p-3 text-left">CRBM</th>
              <th className="sticky left-[150px] top-0 z-30 w-[250px] border-b-2 border-r border-gray-700 bg-gray-800 p-3 text-left">Quartel / Cidade</th>
              {naturezas.map(nat => (
                <th key={nat.codigo} className="sticky top-0 z-20 border-b-2 border-x border-gray-700 bg-gray-800 p-2 text-center" title={nat.nome}>
                  {nat.abreviacao || nat.nome}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 border-b-2 border-l border-gray-700 bg-gray-900 p-3 text-center">TOTAL</th>
              {showActions && (
                <th className="sticky right-0 top-0 z-30 border-b-2 border-l border-gray-700 bg-gray-800 p-3 text-center">Ações</th>
              )}
            </tr>
          </thead>
          
          {Object.entries(cidadesAgrupadas).map(([crbm, listaCidades]) => (
            <tbody key={crbm} className="bg-surface">
            {listaCidades.map((cidade, index) => {
                const podeEditar = !!(isAdmin || (canEditObmId !== undefined && canEditObmId !== null && canEditObmId === cidade.id));
                const dadosParaEdicao: Record<string, number> = {};
                let totalLinha = 0;
                naturezas.forEach(nat => {
                  const qtd = dadosMapa[keyFor(cidade.cidade_nome, nat.codigo)] || 0;
                  dadosParaEdicao[nat.codigo] = qtd;
                  totalLinha += qtd;
                });

                const hasData = totalLinha > 0;
                const rowClasses = hasData ? 'bg-green-900/20' : '';
                const cellCidadeClasses = hasData ? 'text-green-300' : 'bg-red-900/40 text-red-300';

                return (
                  <tr key={cidade.id} className={`text-center hover:bg-border/50 ${rowClasses}`}>
                    {index === 0 && (
                      <td rowSpan={listaCidades.length} className="sticky left-0 z-20 w-[150px] border-b border-r border-border bg-surface p-3 text-left align-top font-bold text-text-strong">{crbm}</td>
                    )}
                    <td className={`sticky left-[150px] z-20 w-[250px] border-b border-r border-border p-3 text-left font-bold ${cellCidadeClasses}`}>
                      {cidade.cidade_nome}
                    </td>
                    {naturezas.map(nat => {
                      const qtd = dadosParaEdicao[nat.codigo] || 0;
                      const cellValueClasses = qtd > 0 ? 'font-bold text-teal-300' : 'text-gray-500';
                      return (
                        <td key={nat.codigo} className={`whitespace-nowrap border-x border-border p-3 ${cellValueClasses}`}>
                          {qtd}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-20 whitespace-nowrap border-l border-border bg-blue-900/30 p-3 font-bold">{totalLinha}</td>
                    {showActions && (
                      <td className="sticky right-0 z-20 whitespace-nowrap border-l border-border p-3 relative">
                        {podeEditar ? (
                          <button onClick={() => onEdit(cidade, dadosParaEdicao)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">
                            Editar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="bg-blue-800 font-bold text-white">
                <td colSpan={2} className="sticky left-0 z-20 border-b border-r border-gray-700 bg-blue-800 p-3 text-center">
                  SUB TOTAL
                </td>
                {naturezas.map(nat => (
                  <td key={`subtotal-${nat.codigo}`} className="border-x border-gray-700 p-3 text-center">{totais.crbm[crbm]?.[nat.codigo] || 0}</td>
                ))}
                <td className="sticky right-0 z-20 border-l border-gray-700 bg-blue-900 p-3 text-center">{totais.crbm[crbm]?.['TOTAL'] || 0}</td>
                {showActions && <td className="sticky right-0 z-20 border-l border-gray-700 p-3"></td>}
              </tr>
            </tbody>
          ))}

          <tfoot className="sticky bottom-0 z-30">
            <tr className="bg-yellow-600 font-bold text-black">
              <td colSpan={2} className="sticky left-0 z-20 border-r border-gray-600 bg-yellow-600 p-3 text-center">TOTAL GERAL</td>
              {naturezas.map(nat => (
                <td key={`total-${nat.codigo}`} className="border-x border-gray-700 p-3 text-center">{totais.geral[nat.codigo] || 0}</td>
              ))}
              <td className="sticky right-0 z-20 border-l border-gray-700 bg-yellow-700 p-3 text-center">{totais.geral['TOTAL']}</td>
              {showActions && <td className="sticky right-0 z-20 border-l border-gray-700 p-3"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default LancamentoTabela;

