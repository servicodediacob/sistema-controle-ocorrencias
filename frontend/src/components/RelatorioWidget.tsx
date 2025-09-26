// Caminho: frontend/src/components/RelatorioWidget.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ReportRow from './ReportRow'; // 1. IMPORTA O COMPONENTE DE LINHA CORRIGIDO
import Spinner from './Spinner';

function RelatorioWidget() {
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  // Função para buscar os dados do relatório do dia atual
  const fetchReport = useCallback(async () => {
    // Se já houver dados, a atualização em segundo plano não mostra o spinner
    if (reportData.length === 0) {
      setLoading(true);
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getRelatorio(today, today);
      setReportData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar relatório diário.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, reportData.length]);

  // Busca os dados ao montar e depois a cada 60 segundos
  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchReport]);

  // Agrupa os dados por 'grupo' para renderização
  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo || 'Estatísticas';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  const crbmHeaders = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

  // Calcula os totais gerais
  const totals = reportData.reduce((acc, row) => {
    (Object.keys(acc) as Array<keyof typeof acc>).forEach(key => {
      acc[key] += Number(row[key as keyof IRelatorioRow]) || 0;
    });
    return acc;
  }, { diurno: 0, noturno: 0, total_capital: 0, total_geral: 0, "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0 });

  const totalGeralRow: IRelatorioRow = {
    grupo: 'TOTAL GERAL',
    subgrupo: 'TOTAL GERAL',
    diurno: String(totals.diurno),
    noturno: String(totals.noturno),
    total_capital: String(totals.total_capital),
    total_geral: String(totals.total_geral),
    "1º CRBM": String(totals["1º CRBM"]),
    "2º CRBM": String(totals["2º CRBM"]),
    "3º CRBM": String(totals["3º CRBM"]),
    "4º CRBM": String(totals["4º CRBM"]),
    "5º CRBM": String(totals["5º CRBM"]),
    "6º CRBM": String(totals["6º CRBM"]),
    "7º CRBM": String(totals["7º CRBM"]),
    "8º CRBM": String(totals["8º CRBM"]),
    "9º CRBM": String(totals["9º CRBM"]),
  };

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
        // 2. A ESTRUTURA DA TABELA É SIMPLIFICADA PARA USAR O NOVO ReportRow
        <div className="mt-4 overflow-x-auto border border-border rounded-md">
          <table className="min-w-full w-full border-collapse text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900/50 text-text-strong">
              <tr>
                <th className="sticky left-0 top-0 z-20 w-[250px] border-r border-border bg-surface p-3 text-left">GRUPO</th>
                <th className="sticky left-[250px] top-0 z-20 w-[250px] border-r border-border bg-surface p-3 text-left">NATUREZA (SUBGRUPO)</th>
                <th className="hidden lg:table-cell p-2">DIURNO</th>
                <th className="hidden lg:table-cell p-2">NOTURNO</th>
                <th className="p-2">TOTAL CAPITAL</th>
                {crbmHeaders.map(h => <th key={h} className="hidden lg:table-cell p-2">{h}</th>)}
                <th className="p-2 lg:hidden">TOTAL INTERIOR</th>
                <th className="p-2">TOTAL GERAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  {subgrupos.map((row, index) => (
                    <ReportRow key={row.subgrupo} row={row} crbmHeaders={crbmHeaders} isFirstInGroup={index === 0} groupSize={subgrupos.length} />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <ReportRow row={totalGeralRow} crbmHeaders={crbmHeaders} isTotalGeral />
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-text">Nenhum dado para exibir no relatório do dia.</p>
      )}
    </div>
  );
}

export default RelatorioWidget;
