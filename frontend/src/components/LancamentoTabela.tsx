// Caminho: frontend/src/components/LancamentoTabela.tsx

import React, { useState, useMemo } from 'react';
import { IEstatisticaAgrupada, ICidade } from '../services/api';
import Spinner from './Spinner';
import Icon from './Icon';

// --- Interfaces (sem alteração) ---
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions?: boolean;
}

interface CardProps {
  cidade: ICidade;
  ocorrencias: Record<string, number>;
  total: number;
  onEdit: () => void;
  showActions: boolean;
}

// --- Componente MobileCard (sem alteração) ---
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
              <div key={natureza} className="flex justify-between border-b border-dashed border-border py-1">
                <span className="text-text">{natureza}</span>
                <span className="font-semibold text-text-strong">{qtd}</span>
              </div>
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


// --- Componente CrbmAccordion (sem alteração) ---
interface CrbmAccordionProps {
  crbmNome: string;
  cidadesDoCrbm: ICidade[];
  dadosMapa: Record<string, number>;
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions: boolean;
}

const CrbmAccordion: React.FC<CrbmAccordionProps> = ({ crbmNome, cidadesDoCrbm, dadosMapa, naturezas, onEdit, showActions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalCrbm = useMemo(() => {
    return cidadesDoCrbm.reduce((acc, cidade) => {
      return acc + naturezas.reduce((cityAcc, nat) => {
        return cityAcc + (dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0);
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
            const ocorrências: Record<string, number> = {};
            let totalLinha = 0;
            naturezas.forEach(nat => {
              const qtd = dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0;
              ocorrências[nat.subgrupo] = qtd;
              totalLinha += qtd;
            });
            return (
              <MobileCard
                key={`mobile-${cidade.id}`}
                cidade={cidade}
                ocorrencias={ocorrências}
                total={totalLinha}
                onEdit={() => onEdit(cidade, ocorrências)}
                showActions={showActions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Componente LancamentoTabela (COM AS ALTERAÇÕES PRINCIPAIS) ---
const LancamentoTabela: React.FC<LancamentoTabelaProps> = ({ 
  dadosApi, 
  cidades, 
  naturezas, 
  loading, 
  onEdit, 
  showActions = true 
}) => {
  if (loading) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-lg bg-surface p-12">
        <Spinner size="lg" text="Carregando dados da tabela..." />
      </div>
    );
  }

  const dadosMapa = useMemo(() => {
    return dadosApi.reduce((acc: Record<string, number>, item: IEstatisticaAgrupada) => {
      const key = `${item.cidade_nome}|${item.natureza_nome}`;
      acc[key] = item.quantidade;
      return acc;
    }, {});
  }, [dadosApi]);

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
      totaisGeral[nat.subgrupo] = 0;
    });
    totaisGeral['TOTAL'] = 0;

    Object.keys(cidadesAgrupadas).forEach(crbm => {
      totaisCrbm[crbm] = {};
      naturezas.forEach(nat => {
        totaisCrbm[crbm][nat.subgrupo] = 0;
      });
      totaisCrbm[crbm]['TOTAL'] = 0;
    });

    cidades.forEach(cidade => {
      let totalCidade = 0;
      naturezas.forEach(nat => {
        const qtd = dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0;
        if (qtd > 0) {
          totaisCrbm[cidade.crbm_nome][nat.subgrupo] += qtd;
          totaisGeral[nat.subgrupo] += qtd;
          totalCidade += qtd;
        }
      });
      totaisCrbm[cidade.crbm_nome]['TOTAL'] += totalCidade;
      totaisGeral['TOTAL'] += totalCidade;
    });

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
          />
        ))}
      </div>

      <div className="mt-8 hidden rounded-lg border border-border bg-surface text-text md:block overflow-x-auto">
        {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
        <table className="min-w-[1300px] w-full border-collapse table-fixed">
          <thead className="bg-gray-700 text-white">
            <tr>
              {/* 1. Adicionamos classes de largura fixa (w-XX) para as duas primeiras colunas */}
              <th className="sticky left-0 top-0 z-30 w-[150px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">CRBM</th>
              <th className="sticky left-[150px] top-0 z-30 w-[250px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">Quartel / Cidade</th>
              {naturezas.map(nat => (
                <th key={nat.subgrupo} className="sticky top-0 z-20 border-b border-x border-gray-700 bg-gray-700 p-3 text-center uppercase">{nat.abreviacao}</th>
              ))}
              <th className="sticky right-0 top-0 z-30 border-b border-l border-gray-700 bg-blue-900 p-3 text-center font-bold uppercase">TOTAL</th>
              {showActions && (
                <th className="sticky right-0 top-0 z-30 border-b border-l border-gray-700 bg-gray-700 p-3 text-center uppercase">AÇÕES</th>
              )}
            </tr>
          </thead>
          
          {Object.entries(cidadesAgrupadas).map(([crbm, listaCidades]) => (
            <tbody key={crbm} className="bg-surface">
              {listaCidades.map((cidade, index) => {
                const ocorrências: Record<string, number> = {};
                let totalLinha = 0;
                naturezas.forEach(nat => {
                  const qtd = dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0;
                  ocorrências[nat.subgrupo] = qtd;
                  totalLinha += qtd;
                });

                const hasData = totalLinha > 0;
                const rowClasses = hasData ? 'bg-green-900/20' : '';
                const cellCidadeClasses = hasData
                  ? 'text-green-300'
                  : 'bg-red-900/40 text-red-300';

                return (
                  <tr key={cidade.id} className={`text-center hover:bg-border/50 ${rowClasses}`}>
                    {/* 2. Adicionamos a mesma classe de largura fixa na célula de dados correspondente */}
                    {index === 0 && (
                      <td rowSpan={listaCidades.length} className="sticky left-0 z-20 w-[150px] border-b border-r border-border bg-surface p-3 text-left align-top font-bold text-text-strong">{crbm}</td>
                    )}
                    <td className={`sticky left-[150px] z-20 w-[250px] border-b border-r border-border p-3 text-left font-bold ${cellCidadeClasses}`}>
                      {cidade.cidade_nome}
                    </td>
                    {naturezas.map(nat => {
                      const qtd = ocorrências[nat.subgrupo];
                      const cellValueClasses = qtd > 0
                        ? 'font-bold text-teal-300'
                        : 'text-gray-500';

                      return (
                        <td key={nat.subgrupo} className={`whitespace-nowrap border-x border-border p-3 ${cellValueClasses}`}>
                          {qtd}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-20 whitespace-nowrap border-l border-border bg-blue-900/30 p-3 font-bold">{totalLinha}</td>
                    {showActions && (
                      <td className="sticky right-0 z-20 whitespace-nowrap border-l border-border p-3">
                        <button onClick={() => onEdit(cidade, ocorrências)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
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
                  <td key={nat.subgrupo} className="border-x border-gray-700 p-3 text-center">{totais.crbm[crbm]?.[nat.subgrupo] || 0}</td>
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
                <td key={nat.subgrupo} className="border-x border-gray-700 p-3 text-center">{totais.geral[nat.subgrupo] || 0}</td>
              ))}
              <td className="sticky right-0 z-20 border-l border-gray-700 bg-yellow-700 p-3 text-center">{totais.geral['TOTAL']}</td>
              {showActions && <td className="sticky right-0 z-20 border-l border-gray-700 p-3"></td>}
            </tr>
          </tfoot>
        </table>
        {/* ======================= FIM DA CORREÇÃO ======================= */}
      </div>
    </>
  );
};

export default LancamentoTabela;
