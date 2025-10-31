// Caminho: frontend/src/components/RelatorioWidget.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// ======================= INÍCIO DA CORREÇÃO =======================
import { getPlantaoRange } from '../utils/date';
import { IRelatorioRow, IDataApoio, getNaturezas } from '../services/api';
// A função de busca agora vem do seu próprio serviço
import { getRelatorioCompleto } from '../services/relatorioService';
// ======================= FIM DA CORREÇÃO =======================
import { useNotification } from '../contexts/NotificationContext';
import Spinner from './Spinner';
import Icon from './Icon';
import { mergeEstatisticasWithNaturezas, CRBM_HEADERS } from '../utils/estatisticas';

// ... (Componentes SubgrupoRow e ReportCard permanecem os mesmos)
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
            {CRBM_HEADERS.map(crbm => {
              const value = Number(row[crbm]);
              if (value === 0) return null;
              return (
                <div key={crbm} className="flex justify-between">
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
  const totalGrupo = useMemo(() => 
    subgrupos.reduce((acc, row) => acc + Number(row.total_geral), 0),
    [subgrupos]
  );

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Icon 
            path="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
            className={`transform text-text-strong transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
          />
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
      // ======================= INÍCIO DA CORREÇÃO =======================
      const { inicioISO, fimISO } = getPlantaoRange();
      const [relatorioData, naturezasData] = await Promise.all([
        getRelatorioCompleto(inicioISO, fimISO),
        getNaturezas().catch((error): IDataApoio[] => {
          console.error('[RelatorioWidget] Falha ao buscar naturezas:', error);
          return [];
        }),
      ]);

      const estatisticasCompletas = mergeEstatisticasWithNaturezas(
        relatorioData.estatisticas,
        naturezasData,
      );

      setReportData(estatisticasCompletas);
      // ======================= FIM DA CORREÇÃO =======================
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

  const groupedData = useMemo(() => 
    reportData.reduce((acc, row) => {
      const grupo = row.grupo || 'Estatísticas';
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(row);
      return acc;
    }, {} as Record<string, IRelatorioRow[]>),
    [reportData]
  );

  const totalGeral = useMemo(() => 
    reportData.reduce((acc, row) => acc + Number(row.total_geral), 0),
    [reportData]
  );

  return (
    <div className="w-full flex-1 rounded-lg bg-surface border border-border p-6 text-text mt-6">
      <div className="flex justify-between items-start border-b border-border pb-4">
        <h3 className="mt-0 text-lg font-semibold text-text-strong">
          Relatório Estatístico do Dia
        </h3>
        <div className="flex-shrink-0 rounded-lg bg-background p-3 text-center shadow-md">
          <span className="text-sm text-gray-400">Total Geral</span>
          <p className="text-3xl font-bold text-blue-400">{totalGeral}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner text="Carregando relatório..." /></div>
      ) : reportData.length > 0 ? (
        <div className="mt-4">
          <div className="space-y-4 lg:hidden">
            {Object.entries(groupedData).map(([grupo, subgrupos]) => (
              <ReportCard key={grupo} grupo={grupo} subgrupos={subgrupos} />
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full w-full border-collapse text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900/50 text-text-strong">
                <tr>
                  <th className="p-2 text-left">GRUPO</th>
                  <th className="p-2 text-left">NATUREZA (SUBGRUPO)</th>
                  <th className="p-2 text-center">DIURNO</th>
                  <th className="p-2 text-center">NOTURNO</th>
                  <th className="p-2 text-center">TOTAL CAPITAL</th>
                  {CRBM_HEADERS.map(h => <th key={h} className="p-2 text-center">{h}</th>)}
                  <th className="p-2 text-center">TOTAL GERAL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                  <React.Fragment key={grupo}>
                    {subgrupos.map((row, index) => (
                      <tr key={row.subgrupo} className="border-b border-border text-center">
                        {index === 0 && (
                          <td rowSpan={subgrupos.length} className="p-2 text-left align-top font-bold text-text-strong border-r border-border">
                            {grupo}
                          </td>
                        )}
                        <td className="p-2 text-left text-text">{row.subgrupo}</td>
                        <td>{row.diurno}</td>
                        <td>{row.noturno}</td>
                        <td className="font-semibold">{row.total_capital}</td>
                        {CRBM_HEADERS.map(h => <td key={h}>{row[h]}</td>)}
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





