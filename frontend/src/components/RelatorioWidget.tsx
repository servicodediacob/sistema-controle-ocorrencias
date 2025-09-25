// frontend/src/components/RelatorioWidget.tsx

import React, { useState, useEffect, ReactElement } from 'react';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import Spinner from './Spinner';

type CrbmKey = "1º CRBM" | "2º CRBM" | "3º CRBM" | "4º CRBM" | "5º CRBM" | "6º CRBM" | "7º CRBM" | "8º CRBM" | "9º CRBM";

function RelatorioWidget(): ReactElement {
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const data = await getRelatorio(today, today);
        setReportData(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao carregar relatório diário.';
        addNotification(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [addNotification]);

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo || 'Estatísticas';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  const crbmHeaders: CrbmKey[] = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

  const totals = reportData.reduce((acc, row) => {
    (Object.keys(acc) as Array<keyof typeof acc>).forEach(key => {
      acc[key] += Number(row[key as keyof IRelatorioRow]) || 0;
    });
    return acc;
  }, { diurno: 0, noturno: 0, total_capital: 0, total_geral: 0, "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0 });

  return (
    <div className="w-full flex-1 rounded-lg bg-surface border border-border p-6 text-text mt-6">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Relatório Estatístico do Dia
      </h3>
      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner text="Carregando relatório..." />
        </div>
      ) : reportData.length > 0 ? (
        <div className="mt-4 overflow-x-auto border border-border rounded-md">
          <table className="min-w-[1200px] w-full border-collapse text-sm">
            {/* CORREÇÃO DE COR: O cabeçalho agora usa cores que se adaptam ao tema. */}
            <thead className="bg-gray-100 dark:bg-gray-900/50 text-text-strong">
              <tr>
                <th rowSpan={2} className="sticky left-0 top-0 z-20 w-[150px] border-r border-border bg-surface p-2 text-left">GRUPO</th>
                <th rowSpan={2} className="sticky left-[150px] top-0 z-20 w-[200px] border-r border-border bg-surface p-2 text-left">NATUREZA (SUBGRUPO)</th>
                <th colSpan={3} className="border-b border-border p-2">ESTATÍSTICA CAPITAL</th>
                <th colSpan={9} className="border-b border-border p-2">ESTATÍSTICA POR CRBM (INTERIOR)</th>
                <th rowSpan={2} className="p-2">TOTAL GERAL</th>
              </tr>
              <tr className="text-xs">
                <th className="p-2 border-t border-border">DIURNO</th>
                <th className="p-2 border-t border-border">NOTURNO</th>
                <th className="p-2 border-t border-border">TOTAL</th>
                {crbmHeaders.map(h => <th key={h} className="p-2 border-t border-border">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-surface">
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  {subgrupos.map((row, index) => (
                    <tr key={`${grupo}-${row.subgrupo}`} className="border-b border-border text-center">
                      {index === 0 && (
                        <td rowSpan={subgrupos.length} className="sticky left-0 z-10 border-r border-border bg-surface p-2 text-left align-top font-bold text-text-strong">
                          {grupo}
                        </td>
                      )}
                      <td className="sticky left-[150px] z-10 border-r border-border bg-surface p-2 text-left text-text-strong">
                        {row.subgrupo}
                      </td>
                      <td>{row.diurno}</td>
                      <td>{row.noturno}</td>
                      <td>{row.total_capital}</td>
                      {crbmHeaders.map(h => <td key={h}>{row[h]}</td>)}
                      <td>{row.total_geral}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="bg-blue-100 dark:bg-blue-800 text-center font-bold text-blue-900 dark:text-white">
                <td colSpan={2} className="p-2 text-right">SUB TOTAL</td>
                <td>{totals.diurno}</td>
                <td>{totals.noturno}</td>
                <td>{totals.total_capital}</td>
                {crbmHeaders.map(h => <td key={h}>{totals[h]}</td>)}
                <td>{totals.total_geral}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-text">Nenhum dado para exibir no relatório do dia.</p>
      )}
    </div>
  );
}

export default RelatorioWidget;
