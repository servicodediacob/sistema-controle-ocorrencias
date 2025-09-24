import React, { useState, useMemo } from 'react';
import { IEstatisticaAgrupada, ICidade } from '../services/api';
import Spinner from './Spinner';

// --- Interfaces ---
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
  showActions?: boolean;
}

// --- Componente de Card para a Visualização Mobile ---
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

  return (
    <div className={`rounded-lg border ${hasData ? 'border-gray-600 bg-gray-800' : 'border-red-800/50 bg-red-900/20'}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <p className="font-bold text-white">{cidade.cidade_nome}</p>
          <p className="text-sm text-gray-400">{cidade.crbm_nome}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total</p>
          <p className={`text-xl font-bold ${hasData ? 'text-teal-400' : 'text-red-400'}`}>{total}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-700 p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(ocorrencias).map(([natureza, qtd]) => (
              <div key={natureza} className="flex justify-between border-b border-dashed border-gray-600 py-1">
                <span className="text-gray-400">{natureza}</span>
                <span className="font-semibold text-white">{qtd}</span>
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


// --- Componente Principal da Tabela (COM A NOVA CORREÇÃO) ---
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
      <div className="mt-8 flex items-center justify-center rounded-lg bg-gray-800 p-12">
        <Spinner size="lg" text="Carregando dados da tabela..." />
      </div>
    );
  }

  const dadosMapa = useMemo(() => {
    return dadosApi.reduce((acc, item) => {
      const key = `${item.cidade_nome}|${item.natureza_nome}`;
      acc[key] = item.quantidade;
      return acc;
    }, {} as Record<string, number>);
  }, [dadosApi]);

  const cidadesAgrupadas = useMemo(() => {
    return cidades.reduce((acc, cidade) => {
      const crbm = cidade.crbm_nome;
      if (!acc[crbm]) acc[crbm] = [];
      acc[crbm].push(cidade);
      return acc;
    }, {} as Record<string, ICidade[]>);
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
      {/* VISUALIZAÇÃO MOBILE (sem alterações) */}
      <div className="mt-4 space-y-4 md:hidden">
        {cidades.map(cidade => {
          const ocorrências: Record<string, number> = {};
          let totalLinha = 0;
          naturezas.forEach(nat => {
            const qtd = dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0;
            if (qtd > 0) {
              ocorrências[nat.subgrupo] = qtd;
              totalLinha += qtd;
            }
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

      {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
      {/* VISUALIZAÇÃO DESKTOP */}
      {/* O 'overflow-x-auto' foi removido deste div */}
      <div className="mt-8 hidden rounded-lg border border-gray-700 bg-gray-800 md:block">
        <table className="min-w-[1300px] w-full border-collapse">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="sticky left-0 top-0 z-30 w-[150px] border-b border-r border-gray-600 bg-gray-800 p-3 text-left font-bold uppercase">CRBM</th>
              <th className="sticky left-[150px] top-0 z-30 w-[250px] border-b border-r border-gray-600 bg-gray-800 p-3 text-left font-bold uppercase">Quartel / Cidade</th>
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
            <tbody key={crbm} className="bg-gray-800">
              {listaCidades.map((cidade, index) => {
                const ocorrências: Record<string, number> = {};
                let totalLinha = 0;
                naturezas.forEach(nat => {
                  const qtd = dadosMapa[`${cidade.cidade_nome}|${nat.subgrupo}`] || 0;
                  ocorrências[nat.subgrupo] = qtd;
                  totalLinha += qtd;
                });

                return (
                  <tr key={cidade.id} className="text-center hover:bg-gray-700/50">
                    {index === 0 && (
                      <td rowSpan={listaCidades.length} className="sticky left-0 z-10 border-b border-r border-gray-700 bg-gray-800 p-3 text-left align-top font-bold">{crbm}</td>
                    )}
                    <td className={`sticky left-[150px] z-10 border-b border-r border-gray-700 p-3 text-left font-bold ${totalLinha === 0 ? 'bg-red-900/50 text-red-200' : 'bg-gray-800'}`}>{cidade.cidade_nome}</td>
                    {naturezas.map(nat => (
                      <td key={nat.subgrupo} className="whitespace-nowrap border-x border-gray-700 p-3">{ocorrências[nat.subgrupo]}</td>
                    ))}
                    <td className="sticky right-0 whitespace-nowrap border-l border-gray-700 bg-blue-900/30 p-3 font-bold">{totalLinha}</td>
                    {showActions && (
                      <td className="sticky right-0 whitespace-nowrap border-l border-gray-700 p-3">
                        <button onClick={() => onEdit(cidade, ocorrências)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {/* Linha de Subtotal agora dentro do tbody */}
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
      {/* ======================= FIM DA CORREÇÃO ======================= */}
    </>
  );
};

export default LancamentoTabela;
