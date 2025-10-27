// frontend/src/components/RelatorioEstatisticoCards.tsx

import React, { useState } from 'react';
import { IRelatorioRow } from '../services/api';
import { CRBM_HEADERS } from '../utils/estatisticas';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RelatorioEstatisticoCardsProps {
  groupedData: Record<string, IRelatorioRow[]>;
  totals: Record<string, number>;
}

const RelatorioEstatisticoCards: React.FC<RelatorioEstatisticoCardsProps> = ({ groupedData, totals }) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubgroups, setOpenSubgroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (grupo: string) => {
    setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  const toggleSubgroup = (subgrupoKey: string) => {
    setOpenSubgroups(prev => ({ ...prev, [subgrupoKey]: !prev[subgrupoKey] }));
  };

  const criarTotaisIniciais = (): Record<string, number> => {
    const base: Record<string, number> = {
      diurno: 0,
      noturno: 0,
      total_capital: 0,
      total_geral: 0,
    };
    CRBM_HEADERS.forEach((header) => {
      base[header] = 0;
    });
    return base;
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedData).map(([grupo, subgrupos]) => {
        const subtotalGrupo = subgrupos.reduce((acc, row) => {
          acc.diurno += Number(row.diurno) || 0;
          acc.noturno += Number(row.noturno) || 0;
          acc.total_capital += Number(row.total_capital) || 0;
          acc.total_geral += Number(row.total_geral) || 0;
          CRBM_HEADERS.forEach((header) => {
            acc[header] += Number(row[header]) || 0;
          });
          return acc;
        }, criarTotaisIniciais());

        return (
          <div key={grupo} className="rounded-lg border border-primary-dark bg-surface-dark shadow-lg">
            <button
              className="flex w-full items-center justify-between p-4 text-xl font-bold text-primary-light"
              onClick={() => toggleGroup(grupo)}
            >
              {grupo}
              <span className="text-sm font-normal text-text">
                Total: {subtotalGrupo.total_geral}
              </span>
              {openGroups[grupo] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {openGroups[grupo] && (
              <div className="border-t border-border p-4 space-y-3">
                {subgrupos.map((row) => {
                  const subgrupoKey = `${grupo}-${row.subgrupo}`;
                  return (
                    <div key={subgrupoKey} className="rounded-md bg-surface border border-border">
                      <button
                        className="flex w-full items-center justify-between p-3 text-md font-medium text-text-strong"
                        onClick={() => toggleSubgroup(subgrupoKey)}
                      >
                        {row.subgrupo}
                        {openSubgroups[subgrupoKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {openSubgroups[subgrupoKey] && (
                        <div className="border-t border-border p-3 text-sm text-text grid grid-cols-2 gap-2 bg-background">
                          <div className="col-span-2 font-semibold text-text-strong">Dados Estatísticos:</div>
                          <div><span className="font-medium">Diurno:</span> {row.diurno}</div>
                          <div><span className="font-medium">Noturno:</span> {row.noturno}</div>
                          <div><span className="font-medium">Total Capital:</span> {row.total_capital}</div>
                          {CRBM_HEADERS.map(header => (
                            <div key={header}><span className="font-medium">{header}:</span> {row[header]}</div>
                          ))}
                          <div><span className="font-medium">Total Geral:</span> {row.total_geral}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {/* Total Geral Card */}
      <div className="rounded-lg border border-primary-dark bg-surface-dark shadow-lg mt-6">
        <button
          className="flex w-full items-center justify-between p-4 text-xl font-bold text-primary-light"
          onClick={() => toggleGroup('TOTAL_GERAL')} // Using a unique key for the total group
        >
          TOTAL GERAL
          <span className="text-sm font-normal text-text">
            Total: {totals.total_geral}
          </span>
          {openGroups['TOTAL_GERAL'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {openGroups['TOTAL_GERAL'] && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="rounded-md bg-surface border border-border">
              <div className="p-3 text-sm text-text grid grid-cols-2 gap-2">
                <div className="col-span-2 font-semibold text-text-strong">Dados Consolidados:</div>
                <div><span className="font-medium">Diurno:</span> {totals.diurno}</div>
                <div><span className="font-medium">Noturno:</span> {totals.noturno}</div>
                <div><span className="font-medium">Total Capital:</span> {totals.total_capital}</div>
                {CRBM_HEADERS.map(header => (
                  <div key={header}><span className="font-medium">{header}:</span> {totals[header]}</div>
                ))}
                <div><span className="font-medium">Total Geral:</span> {totals.total_geral}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatorioEstatisticoCards;
