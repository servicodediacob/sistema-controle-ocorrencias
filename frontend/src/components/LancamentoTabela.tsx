// Caminho: frontend/src/components/LancamentoTabela.tsx

import React, { useState, useMemo } from 'react';
import { IEstatisticaAgrupada, ICidade } from '../services/api';
import Spinner from './Spinner';

// --- CORREÇÃO 1: MOVER A INTERFACE PARA FORA DO COMPONENTE ---
// A interface de props deve ser definida no escopo do módulo para ser acessível.
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions?: boolean;
}

// --- Interface para as props do Card ---
interface CardProps {
  cidade: ICidade;
  ocorrencias: Record<string, number>;
  total: number;
  onEdit: () => void;
  showActions: boolean;
}

// --- Componente MobileCard ---
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


// --- Componente Principal da Tabela ---
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
    // --- CORREÇÃO 2: ADICIONAR TIPOS AO REDUCE ---
    return dadosApi.reduce((acc: Record<string, number>, item: IEstatisticaAgrupada) => {
      const key = `${item.cidade_nome}|${item.natureza_nome}`;
      acc[key] = item.quantidade;
      return acc;
    }, {});
  }, [dadosApi]);

  const cidadesAgrupadas = useMemo(() => {
    // --- CORREÇÃO 3: ADICIONAR TIPOS AO REDUCE ---
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
      {/* VISUALIZAÇÃO MOBILE */}
      <div className="mt-4 space-y-4 md:hidden">
        {cidades.map(cidade => {
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

      {/* VISUALIZAÇÃO DESKTOP */}
      <div className="mt-8 hidden rounded-lg border border-border bg-surface text-text md:block overflow-x-auto">
        <table className="min-w-[1300px] w-full border-collapse">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="sticky left-0 top-0 z-30 w-[150px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">CRBM</th>
              <th className="sticky left-[150px] top-0 z-30 w-[250px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">Quartel / Cidade</th>
              {naturezas.map(nat => (
                <th key={nat.subgrupo} className="sticky top-0 z-20 border-b border-x border-gray-700 bg-gray-700 p-3 text-center uppercase">{nat.abreviacao}</th>
              ))}
              <th className="sticky right-0 top-0 z-20 border-b border-l border-gray-700 bg-blue-900 p-3 text-center font-bold uppercase">TOTAL</th>
              {showActions && (
                <th className="sticky right-0 top-0 z-20 border-b border-l border-gray-700 bg-gray-700 p-3 text-center uppercase">AÇÕES</th>
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

                const cellClass = totalLinha > 0
                  ? 'dark:bg-green-900/30 dark:text-green-300 bg-green-100 text-green-800'
                  : 'dark:bg-red-900/50 dark:text-red-300 bg-red-100 text-red-800';

                return (
                  <tr key={cidade.id} className="text-center hover:bg-border/50">
                    {index === 0 && (
                      <td rowSpan={listaCidades.length} className="sticky left-0 z-10 border-b border-r border-border bg-surface p-3 text-left align-top font-bold text-text-strong">{crbm}</td>
                    )}
                    <td className={`sticky left-[150px] z-10 border-b border-r border-border p-3 text-left font-bold ${cellClass}`}>{cidade.cidade_nome}</td>
                    {naturezas.map(nat => (
                      <td key={nat.subgrupo} className="whitespace-nowrap border-x border-border p-3">{ocorrências[nat.subgrupo]}</td>
                    ))}
                    <td className="sticky right-0 whitespace-nowrap border-l border-border bg-blue-900/30 p-3 font-bold">{totalLinha}</td>
                    {showActions && (
                      <td className="sticky right-0 whitespace-nowrap border-l border-border p-3">
                        <button onClick={() => onEdit(cidade, ocorrências)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {/* Linha de Subtotal */}
              <tr className="bg-blue-800 font-bold text-white">
                <td colSpan={2} className="sticky left-0 z-10 border-b border-r border-gray-700 bg-blue-800 p-3 text-center">
                  SUB TOTAL
                </td>
                {naturezas.map(nat => (
                  <td key={nat.subgrupo} className="border-x border-gray-700 p-3 text-center">{totais.crbm[crbm]?.[nat.subgrupo] || 0}</td>
                ))}
                <td className="sticky right-0 border-l border-gray-700 bg-blue-900 p-3 text-center">{totais.crbm[crbm]?.['TOTAL'] || 0}</td>
                {showActions && <td className="sticky right-0 border-l border-gray-700 p-3"></td>}
              </tr>
            </tbody>
          ))}

          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-yellow-600 font-bold text-black">
              <td colSpan={2} className="sticky left-0 z-10 border-r border-gray-600 bg-yellow-600 p-3 text-center">TOTAL GERAL</td>
              {naturezas.map(nat => (
                <td key={nat.subgrupo} className="border-x border-gray-700 p-3 text-center">{totais.geral[nat.subgrupo] || 0}</td>
              ))}
              <td className="sticky right-0 border-l border-gray-700 bg-yellow-700 p-3 text-center">{totais.geral['TOTAL']}</td>
              {showActions && <td className="sticky right-0 border-l border-gray-700 p-3"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default LancamentoTabela;
