// Caminho: frontend/src/components/LancamentoTabela.tsx

import React, { useState } from 'react';
import { IEstatisticaAgrupada, ICidade } from '../services/api';
import Spinner from './Spinner';

// --- Interfaces ---
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
}

// --- Componente de Card para a Visualização Mobile ---
interface CardProps {
  cidade: ICidade;
  ocorrencias: Record<string, number>;
  total: number;
  onEdit: () => void;
}

const MobileCard: React.FC<CardProps> = ({ cidade, ocorrencias, total, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasData = total > 0;

  return (
    <div className={`rounded-lg border ${hasData ? 'border-gray-600 bg-gray-800' : 'border-red-800/50 bg-red-900/20'}`}>
      {/* Cabeçalho do Card */}
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

      {/* Corpo Expansível do Card */}
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
          <button
            onClick={onEdit}
            className="mt-4 w-full rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
          >
            Editar Lançamento
          </button>
        </div>
      )}
    </div>
  );
};


// --- Componente Principal da Tabela ---
const LancamentoTabela: React.FC<LancamentoTabelaProps> = ({ dadosApi, cidades, naturezas, loading, onEdit }) => {
  if (loading) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-lg bg-gray-800 p-12">
        <Spinner size="lg" text="Carregando dados da tabela..." />
      </div>
    );
  }

  const dadosMapa = dadosApi.reduce((acc, item) => {
    if (!acc[item.cidade_nome]) acc[item.cidade_nome] = {};
    acc[item.cidade_nome][item.natureza_nome] = item.quantidade;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const cidadesAgrupadas = cidades.reduce((acc, cidade) => {
    const crbm = cidade.crbm_nome;
    if (!acc[crbm]) acc[crbm] = [];
    acc[crbm].push(cidade);
    return acc;
  }, {} as Record<string, ICidade[]>);

  const totais = {
    crbm: {} as Record<string, Record<string, number>>,
    geral: {} as Record<string, number>
  };
  naturezas.forEach(nat => { totais.geral[nat.subgrupo] = 0; });
  totais.geral['TOTAL'] = 0;

  for (const crbm in cidadesAgrupadas) {
    totais.crbm[crbm] = {};
    naturezas.forEach(nat => { totais.crbm[crbm][nat.subgrupo] = 0; });
    totais.crbm[crbm]['TOTAL'] = 0;
    for (const cidade of cidadesAgrupadas[crbm]) {
      const dadosCidade = dadosMapa[cidade.cidade_nome] || {};
      let totalCidade = 0;
      for (const natureza of naturezas) {
        const qtd = dadosCidade[natureza.subgrupo] || 0;
        totais.crbm[crbm][natureza.subgrupo] += qtd;
        totais.geral[natureza.subgrupo] += qtd;
        totalCidade += qtd;
      }
      totais.crbm[crbm]['TOTAL'] += totalCidade;
      totais.geral['TOTAL'] += totalCidade;
    }
  }

  return (
    <>
      {/* ===== VISUALIZAÇÃO MOBILE (CARDS) ===== */}
      {/* Visível apenas em telas pequenas (escondido em 'md' e maiores) */}
      <div className="mt-4 space-y-4 md:hidden">
        {cidades.map(cidade => {
          const ocorrências = dadosMapa[cidade.cidade_nome] || {};
          const totalLinha = Object.values(ocorrências).reduce((a, b) => a + b, 0);
          return (
            <MobileCard
              key={`mobile-${cidade.id}`}
              cidade={cidade}
              ocorrencias={ocorrências}
              total={totalLinha}
              onEdit={() => onEdit(cidade, ocorrências)}
            />
          );
        })}
      </div>

      {/* ===== VISUALIZAÇÃO DESKTOP (TABELA) ===== */}
      {/* Escondida em telas pequenas, vira uma tabela a partir de 'md' */}
      <div className="mt-8 hidden overflow-x-auto rounded-lg border border-gray-700 bg-gray-800 md:block">
        <table className="min-w-[1300px] w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-[150px] border border-gray-700 bg-gray-800 p-3 text-left font-bold uppercase">CRBM</th>
              <th className="sticky left-[150px] top-0 z-10 w-[250px] border border-gray-700 bg-gray-800 p-3 text-left font-bold uppercase">Quartel / Cidade</th>
              {naturezas.map(nat => (
                <th key={nat.subgrupo} className="sticky top-0 border border-gray-700 bg-gray-700 p-3 text-center uppercase">{nat.abreviacao}</th>
              ))}
              <th className="sticky top-0 border border-gray-700 bg-blue-900 p-3 text-center font-bold uppercase">TOTAL</th>
              <th className="sticky top-0 border border-gray-700 bg-gray-700 p-3 text-center uppercase">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cidadesAgrupadas).map(([crbm, listaCidades]) => (
              <React.Fragment key={crbm}>
                {listaCidades.map((cidade, index) => {
                  const ocorrências = dadosMapa[cidade.cidade_nome] || {};
                  const totalLinha = Object.values(ocorrências).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={cidade.id} className="text-center hover:bg-gray-700/50">
                      {index === 0 && (
                        <td rowSpan={listaCidades.length + 1} className="sticky left-0 z-10 border border-gray-700 bg-gray-800 p-3 text-left align-middle font-bold">{crbm}</td>
                      )}
                      <td className={`sticky left-[150px] border border-gray-700 p-3 text-left font-bold ${totalLinha === 0 ? 'bg-red-900/50 text-red-200' : 'bg-gray-800'}`}>{cidade.cidade_nome}</td>
                      {naturezas.map(nat => (
                        <td key={nat.subgrupo} className="whitespace-nowrap border border-gray-700 p-3">{ocorrências[nat.subgrupo] || 0}</td>
                      ))}
                      <td className="whitespace-nowrap border border-gray-700 bg-blue-900/50 p-3 font-bold">{totalLinha}</td>
                      <td className="whitespace-nowrap border border-gray-700 p-3">
                        <button onClick={() => onEdit(cidade, ocorrências)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-800 font-bold text-white">
                  <td className="sticky left-[150px] border border-gray-700 p-3 text-center">TOTAL</td>
                  {naturezas.map(nat => (
                    <td key={nat.subgrupo} className="border border-gray-700 p-3 text-center">{totais.crbm[crbm][nat.subgrupo] || 0}</td>
                  ))}
                  <td className="border border-gray-700 bg-blue-900 p-3 text-center">{totais.crbm[crbm]['TOTAL']}</td>
                  <td className="border border-gray-700 p-3"></td>
                </tr>
              </React.Fragment>
            ))}
            <tr className="bg-yellow-600 font-bold text-black">
              <td colSpan={2} className="sticky left-0 border border-gray-700 p-3 text-center">TOTAL GERAL</td>
              {naturezas.map(nat => (
                <td key={nat.subgrupo} className="border border-gray-700 p-3 text-center">{totais.geral[nat.subgrupo] || 0}</td>
              ))}
              <td className="border border-gray-700 bg-yellow-700 p-3 text-center">{totais.geral['TOTAL']}</td>
              <td className="border border-gray-700 p-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LancamentoTabela;
