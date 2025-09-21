// Caminho: frontend/src/components/LancamentoTabela.tsx

import React from 'react';
// Não precisamos mais de 'styled-components'
import { IEstatisticaAgrupada, ICidade } from '../services/api';

// --- Interfaces (sem alterações) ---
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void;
}

const LancamentoTabela: React.FC<LancamentoTabelaProps> = ({ dadosApi, cidades, naturezas, loading, onEdit }) => {
  // --- Lógica do Componente (sem alterações) ---
  if (loading) {
    return (
      <div className="mt-8 rounded-lg bg-gray-800 p-12 text-center text-gray-500">
        Carregando dados...
      </div>
    );
  }

  const dadosMapa = dadosApi.reduce((acc, item) => {
    if (!acc[item.cidade_nome]) {
      acc[item.cidade_nome] = {};
    }
    acc[item.cidade_nome][item.natureza_nome] = item.quantidade;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const cidadesAgrupadas = cidades.reduce((acc, cidade) => {
    const crbm = cidade.crbm_nome;
    if (!acc[crbm]) {
      acc[crbm] = [];
    }
    acc[crbm].push(cidade);
    return acc;
  }, {} as Record<string, ICidade[]>);

  const totais = {
    crbm: {} as Record<string, Record<string, number>>,
    geral: {} as Record<string, number>
  };

  naturezas.forEach(nat => totais.geral[nat.subgrupo] = 0);
  totais.geral['TOTAL'] = 0;

  for (const crbm in cidadesAgrupadas) {
    totais.crbm[crbm] = {};
    naturezas.forEach(nat => totais.crbm[crbm][nat.subgrupo] = 0);
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

  // --- JSX Refatorado com Tailwind CSS ---
  return (
    // TableWrapper
    <div className="mt-8 overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
      {/* StyledTable */}
      <table className="min-w-[1300px] w-full border-collapse">
        <thead>
          <tr>
            {/* Cabeçalhos fixos (sticky) */}
            <th className="sticky left-0 z-20 w-[150px] border border-gray-700 bg-gray-800 p-3 text-left font-bold uppercase">CRBM</th>
            <th className="sticky left-[150px] z-10 w-[250px] border border-gray-700 bg-gray-800 p-3 text-left font-bold uppercase">Quartel / Cidade</th>
            {naturezas.map(nat => (
              <th key={nat.subgrupo} className="border border-gray-700 bg-gray-700 p-3 text-center uppercase sticky top-0">
                {nat.abreviacao}
              </th>
            ))}
            <th className="border border-gray-700 bg-blue-900 p-3 text-center font-bold uppercase sticky top-0">TOTAL</th>
            <th className="border border-gray-700 bg-gray-700 p-3 text-center uppercase sticky top-0">AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cidadesAgrupadas).map(([crbm, listaCidades]) => (
            <React.Fragment key={crbm}>
              {listaCidades.map((cidade, index) => {
                const ocorrências = dadosMapa[cidade.cidade_nome] || {};
                const totalLinha = Object.values(ocorrências).reduce((a, b) => a + b, 0);
                const isPendente = totalLinha === 0;

                return (
                  <tr key={cidade.id} className="text-center">
                    {/* Célula CRBM com rowSpan */}
                    {index === 0 && (
                      <td
                        rowSpan={listaCidades.length + 1}
                        className="sticky left-0 z-10 border border-gray-700 bg-gray-800 p-3 text-left font-bold"
                      >
                        {crbm}
                      </td>
                    )}
                    {/* Célula Cidade com estilo condicional */}
                    <td
                      className={`sticky left-[150px] border border-gray-700 p-3 text-left font-bold ${isPendente ? 'bg-red-900/50 text-red-200' : 'bg-gray-800'}`}
                    >
                      {cidade.cidade_nome}
                    </td>
                    {naturezas.map(nat => (
                      <td key={nat.subgrupo} className="whitespace-nowrap border border-gray-700 p-3">
                        {ocorrências[nat.subgrupo] || 0}
                      </td>
                    ))}
                    <td className="whitespace-nowrap border border-gray-700 bg-blue-900/50 p-3 font-bold">
                      {totalLinha}
                    </td>
                    <td className="whitespace-nowrap border border-gray-700 p-3">
                      {/* EditButton */}
                      <button
                        onClick={() => onEdit(cidade, ocorrências)}
                        className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* Linha de Total do CRBM */}
              <tr className="bg-blue-800 font-bold text-white">
                <td className="sticky left-[150px] border border-gray-700 p-3 text-right">TOTAL</td>
                {naturezas.map(nat => (
                  <td key={nat.subgrupo} className="border border-gray-700 p-3">
                    {totais.crbm[crbm][nat.subgrupo] || 0}
                  </td>
                ))}
                <td className="border border-gray-700 bg-blue-900 p-3">{totais.crbm[crbm]['TOTAL']}</td>
                <td className="border border-gray-700 p-3"></td> {/* Célula vazia */}
              </tr>
            </React.Fragment>
          ))}
          {/* Linha de Total Geral */}
          <tr className="bg-yellow-600 font-bold text-black">
            <td colSpan={2} className="sticky left-0 border border-gray-700 p-3 text-right">
              TOTAL GERAL
            </td>
            {naturezas.map(nat => (
              <td key={nat.subgrupo} className="border border-gray-700 p-3">
                {totais.geral[nat.subgrupo] || 0}
              </td>
            ))}
            <td className="border border-gray-700 bg-yellow-700 p-3">{totais.geral['TOTAL']}</td>
            <td className="border border-gray-700 p-3"></td> {/* Célula vazia */}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default LancamentoTabela;
