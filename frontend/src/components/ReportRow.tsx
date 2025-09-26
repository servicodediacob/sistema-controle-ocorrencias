// Caminho: frontend/src/components/ReportRow.tsx

import React, { useState } from 'react';
import { IRelatorioRow } from '../services/api';

interface ReportRowProps {
  row: IRelatorioRow;
  crbmHeaders?: string[];
  isFirstInGroup?: boolean;
  groupSize?: number;
  isSubtotal?: boolean;
  isTotalGeral?: boolean;
}

const ReportRow: React.FC<ReportRowProps> = ({
  row,
  crbmHeaders = [],
  isFirstInGroup = false,
  groupSize = 1,
  isSubtotal = false,
  isTotalGeral = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcula o total do interior somando todos os CRBMs (exceto o 1º CRBM que é a capital)
  const totalInterior = crbmHeaders
    .filter(h => h !== '1º CRBM') // Exclui a capital da soma do interior
    .reduce((acc, crbm) => acc + Number(row[crbm as keyof IRelatorioRow] || 0), 0);

  // Define as classes de estilo com base no tipo de linha
  let rowClasses = 'text-center';
  let firstCellClasses = 'sticky left-0 z-10 border-r border-border bg-surface p-3 text-left align-top';
  let secondCellClasses = 'sticky left-[250px] z-10 border-r border-border bg-surface p-3 text-left';

  if (isSubtotal) {
    rowClasses += ' bg-blue-800 font-bold text-white';
    firstCellClasses = ''; // Não aplicável para subtotal
    secondCellClasses = 'sticky left-0 z-10 border-r border-gray-700 bg-blue-800 p-3 text-right';
  } else if (isTotalGeral) {
    rowClasses += ' bg-yellow-600 font-bold text-black';
    firstCellClasses = 'sticky left-0 z-10 border-r border-gray-600 bg-yellow-600 p-3 text-center';
    secondCellClasses = ''; // Não aplicável para total geral
  } else {
    // Linhas normais são clicáveis em telas menores
    rowClasses += ' border-b border-border hover:bg-border/50 lg:cursor-default cursor-pointer';
  }

  // --- RENDERIZAÇÃO PARA TOTAL GERAL (sem alteração na lógica, apenas estilo) ---
  if (isTotalGeral) {
    return (
      <tr className={rowClasses}>
        <td colSpan={2} className={firstCellClasses}>
          {row.grupo}
        </td>
        <td className="hidden lg:table-cell">{row.diurno}</td>
        <td className="hidden lg:table-cell">{row.noturno}</td>
        <td>{row.total_capital}</td>
        {crbmHeaders.map(h => <td key={h} className="hidden lg:table-cell">{row[h as keyof IRelatorioRow]}</td>)}
        <td className="lg:hidden">{totalInterior}</td>
        <td className="bg-yellow-700">{row.total_geral}</td>
      </tr>
    );
  }

  // --- RENDERIZAÇÃO PARA SUBTOTAL (sem alteração na lógica, apenas estilo) ---
  if (isSubtotal) {
    return (
      <tr className={rowClasses}>
        <td colSpan={2} className={secondCellClasses}>
          {row.subgrupo}
        </td>
        <td className="hidden lg:table-cell">{row.diurno}</td>
        <td className="hidden lg:table-cell">{row.noturno}</td>
        <td>{row.total_capital}</td>
        {crbmHeaders.map(h => <td key={h} className="hidden lg:table-cell">{row[h as keyof IRelatorioRow]}</td>)}
        <td className="lg:hidden">{totalInterior}</td>
        <td className="bg-blue-900">{row.total_geral}</td>
      </tr>
    );
  }

  // --- RENDERIZAÇÃO PARA LINHAS DE DADOS NORMAIS (COM LÓGICA DE EXPANSÃO) ---
  return (
    <>
      {/* Linha principal visível */}
      <tr className={rowClasses} onClick={() => setIsExpanded(!isExpanded)}>
        {isFirstInGroup && (
          <td rowSpan={groupSize} className={firstCellClasses}>
            {row.grupo}
          </td>
        )}
        <td className={secondCellClasses}>
          <button className="flex items-center gap-2 w-full text-left cursor-pointer">
            {/* Ícone de seta que gira com a expansão */}
            <span className={`transform transition-transform duration-200 lg:hidden ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
            {row.subgrupo}
          </button>
        </td>
        {/* Colunas que somem em telas pequenas */}
        <td className="hidden lg:table-cell">{row.diurno}</td>
        <td className="hidden lg:table-cell">{row.noturno}</td>
        <td className="font-semibold">{row.total_capital}</td>
        {crbmHeaders.map(h => <td key={h} className="hidden lg:table-cell">{row[h as keyof IRelatorioRow]}</td>)}
        {/* Coluna "Total Interior" que aparece apenas em telas pequenas */}
        <td className="font-semibold lg:hidden">{totalInterior}</td>
        <td className="font-bold bg-blue-900/30">{row.total_geral}</td>
      </tr>

      {/* Linha de Detalhes Expansível para Mobile */}
      {isExpanded && (
        <tr className="lg:hidden bg-gray-900/50">
          {/* A célula ocupa todas as colunas visíveis no mobile */}
          <td colSpan={4} className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-semibold col-span-2 text-gray-300">Detalhes:</div>
              <div className="flex justify-between"><span className="text-gray-400">Capital (Diurno):</span> {row.diurno}</div>
              <div className="flex justify-between"><span className="text-gray-400">Capital (Noturno):</span> {row.noturno}</div>
              {crbmHeaders.map(h => (
                <div key={h} className="flex justify-between">
                  <span className="text-gray-400">{h}:</span> {row[h as keyof IRelatorioRow]}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ReportRow;
