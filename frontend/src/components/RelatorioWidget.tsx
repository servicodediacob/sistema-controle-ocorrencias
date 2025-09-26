// Caminho: frontend/src/components/RelatorioWidget.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ReportRow from './ReportRow'; // Mantemos o ReportRow para a versão mobile
import Spinner from './Spinner';

// ... (Componentes ReportCard e SubgrupoRow permanecem os mesmos) ...
const crbmHeaders: (keyof IRelatorioRow)[] = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

interface SubgrupoRowProps {
  row: IRelatorioRow;
}

const SubgrupoRow: React.FC<SubgrupoRowProps> = ({ row }) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (Number(row.total_geral) === 0) {
    return (
      <li className="flex justify-between text-sm border-b border-dashed border-border/30 pb-1 text-gray-500">
        <span>{row.subgrupo}</span>
        <span className="font-semibold">0</span>
      </li>
    );
  }

  return (
    <li>
      <div
        className="flex justify-between text-sm border-b border-dashed border-border/50 pb-1 cursor-pointer"
        onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className={`transform transition-transform duration-200 ${isDetailsExpanded ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-text">{row.subgrupo}</span>
        </div>
        <span className="font-semibold text-text-strong">{row.total_geral}</span>
      </div>

      {isDetailsExpanded && (
        <div className="mt-2 mb-3 pl-6 pr-2 py-2 bg-background rounded-md">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between col-span-2 border-b border-border/20 pb-1 mb-1">
                <span className="font-bold text-text-strong">Capital (Diurno):</span>
                <span className="font-mono">{row.diurno}</span>
            </div>
            <div className="flex justify-between col-span-2 border-b border-border/20 pb-1 mb-1">
                <span className="font-bold text-text-strong">Capital (Noturno):</span>
                <span className="font-mono">{row.noturno}</span>
            </div>
            {crbmHeaders.map(crbm => {
              const value = Number(row[crbm]);
              if (value === 0) return null;
              return (
                <div key={crbm as string} className="flex justify-between">
                  <span className="text-gray-400">{crbm}:</span>
                  <span className="font-mono">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
};

interface ReportCardProps {
  grupo: string;
  subgrupos: IRelatorioRow[];
}

const ReportCard: React.FC<ReportCardProps> = ({ grupo, subgrupos }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalGrupo = subgrupos.reduce((acc, row) => acc + Number(row.total_geral), 0);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`transform text-text-strong transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
          <p className="font-bold text-text-strong">{grupo}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text">Total</p>
          <p className={`text-xl font-bold ${totalGrupo > 0 ? 'text-blue-400' : 'text-text'}`}>{totalGrupo}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4">
          <ul className="space-y-3">
            {subgrupos.map(row => (
              <SubgrupoRow key={row.subgrupo} row={row} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


function RelatorioWidget() {
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchReport = useCallback(async () => {
    if (reportData.length === 0) setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getRelatorio(today, today);
      setReportData(data);
    } catch (error) {
      addNotification('Falha ao carregar relatório diário.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, reportData.length]);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 60000);
    return () => clearInterval(interval);
  }, [fetchReport]);

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo || 'Estatísticas';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  return (
    <div className="w-full flex-1 rounded-lg bg-surface border border-border p-6 text-text mt-6">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Relatório Estatístico do Dia
      </h3>
      {loading ? (
        <div className="flex justify-center p-10"><Spinner text="Carregando relatório..." /></div>
      ) : reportData.length > 0 ? (
        <div className="mt-4">
          {/* RENDERIZAÇÃO PARA MOBILE (Cards aninhados) */}
          <div className="space-y-4 lg:hidden">
            {Object.entries(groupedData).map(([grupo, subgrupos]) => (
              <ReportCard key={grupo} grupo={grupo} subgrupos={subgrupos} />
            ))}
          </div>

          {/* ================================================================= */}
          {/* --- RENDERIZAÇÃO PARA DESKTOP (Tabela com Células Mescladas) --- */}
          {/* ================================================================= */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full w-full border-collapse text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900/50 text-text-strong">
                <tr>
                  <th className="p-2 text-left">GRUPO</th>
                  <th className="p-2 text-left">NATUREZA (SUBGRUPO)</th>
                  <th className="p-2 text-center">DIURNO</th>
                  <th className="p-2 text-center">NOTURNO</th>
                  <th className="p-2 text-center">TOTAL CAPITAL</th>
                  {crbmHeaders.map(h => <th key={h as string} className="p-2 text-center">{h}</th>)}
                  <th className="p-2 text-center">TOTAL GERAL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                  <React.Fragment key={grupo}>
                    {subgrupos.map((row, index) => (
                      <tr key={row.subgrupo} className="border-b border-border text-center">
                        {/* A célula do GRUPO só é renderizada para a primeira linha do grupo */}
                        {index === 0 && (
                          <td rowSpan={subgrupos.length} className="p-2 text-left align-top font-bold text-text-strong border-r border-border">
                            {grupo}
                          </td>
                        )}
                        <td className="p-2 text-left text-text">{row.subgrupo}</td>
                        <td>{row.diurno}</td>
                        <td>{row.noturno}</td>
                        <td className="font-semibold">{row.total_capital}</td>
                        {crbmHeaders.map(h => <td key={h as string}>{row[h]}</td>)}
                        <td className="font-bold bg-blue-900/30">{row.total_geral}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-text">Nenhum dado para exibir no relatório do dia.</p>
      )}
    </div>
  );
}

export default RelatorioWidget;
