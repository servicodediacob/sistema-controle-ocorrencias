import React, { useState } from 'react';
import { IRelatorioRow } from '../services/api';

// Interface das props (COM A CORREÇÃO)
interface ReportRowProps {
  row: IRelatorioRow;
  isGroupHeader?: boolean;
  // ======================= CORREÇÃO APLICADA AQUI =======================
  // A prop agora é opcional, pois não é usada no cabeçalho do grupo.
  crbmHeaders?: string[];
  // ======================================================================
}

const ReportRow: React.FC<ReportRowProps> = ({ row, isGroupHeader = false, crbmHeaders = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // O valor padrão `[]` no destructuring acima garante que o código abaixo não quebre.
  const totalInterior = crbmHeaders.reduce((acc, crbm) => acc + Number(row[crbm as keyof IRelatorioRow] || 0), 0);

  if (isGroupHeader) {
    return (
      <tr className="bg-gray-900">
        <td colSpan={14} className="p-3 font-bold text-yellow-400 uppercase">
          {row.grupo}
        </td>
      </tr>
    );
  }

  return (
    <>
      {/* Linha Principal (visível em todos os tamanhos) */}
      <tr className="border-b border-gray-700 text-center hover:bg-gray-700/50" onClick={() => setIsExpanded(!isExpanded)}>
        <td className="sticky left-0 z-10 border-r border-gray-700 bg-gray-800 p-3 text-left">
          <button className="flex items-center gap-2 w-full text-left cursor-pointer">
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
            {row.subgrupo}
          </button>
        </td>
        
        <td className="hidden lg:table-cell">{row.diurno}</td>
        <td className="hidden lg:table-cell">{row.noturno}</td>
        <td className="font-semibold">{row.total_capital}</td>
        {crbmHeaders.map(h => <td key={h} className="hidden lg:table-cell">{row[h as keyof IRelatorioRow]}</td>)}
        <td className="font-semibold lg:hidden">{totalInterior}</td>
        <td className="font-bold bg-blue-900/30">{row.total_geral}</td>
      </tr>

      {/* Linha de Detalhes (expansível, visível apenas em Mobile/Tablet) */}
      {isExpanded && (
        <tr className="lg:hidden bg-gray-900/50">
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
