// Caminho: frontend/src/pages/RelatorioPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import ReportRow from '../components/ReportRow';
import Spinner from '../components/Spinner';

function RelatorioPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleGenerateReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRelatorio(dataInicio, dataFim);
      setReportData(data);
      if (data.length === 0) {
        addNotification('Nenhum dado encontrado para o período selecionado.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar relatório.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, addNotification]);

  // Carrega o relatório do dia atual ao montar a página
  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  // Agrupa os dados por 'grupo' para renderização
  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo;
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
    <MainLayout pageTitle="Relatório Estatístico de Ocorrências">
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg bg-surface border border-border p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="data-inicio" className="text-sm text-text">Data de Início</label>
          <input id="data-inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="data-fim" className="text-sm text-text">Data de Fim</label>
          <input id="data-fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <button onClick={handleGenerateReport} disabled={loading} className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {loading && <div className="flex justify-center p-10"><Spinner text="Gerando relatório..." /></div>}

      {!loading && reportData.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
          <table className="min-w-full w-full border-collapse text-sm">
            <thead className="bg-gray-200 dark:bg-gray-700 text-text-strong">
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
              {Object.entries(groupedData).map(([grupo, subgrupos]) => {
                const subtotalGrupo = subgrupos.reduce((acc, row) => {
                  (Object.keys(acc) as Array<keyof typeof acc>).forEach(key => {
                    acc[key] += Number(row[key as keyof IRelatorioRow]) || 0;
                  });
                  return acc;
                }, { diurno: 0, noturno: 0, total_capital: 0, total_geral: 0, "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0 });

                const subtotalRow: IRelatorioRow = {
                  grupo: grupo,
                  subgrupo: 'SUB TOTAL',
                  diurno: String(subtotalGrupo.diurno),
                  noturno: String(subtotalGrupo.noturno),
                  total_capital: String(subtotalGrupo.total_capital),
                  total_geral: String(subtotalGrupo.total_geral),
                  "1º CRBM": String(subtotalGrupo["1º CRBM"]),
                  "2º CRBM": String(subtotalGrupo["2º CRBM"]),
                  "3º CRBM": String(subtotalGrupo["3º CRBM"]),
                  "4º CRBM": String(subtotalGrupo["4º CRBM"]),
                  "5º CRBM": String(subtotalGrupo["5º CRBM"]),
                  "6º CRBM": String(subtotalGrupo["6º CRBM"]),
                  "7º CRBM": String(subtotalGrupo["7º CRBM"]),
                  "8º CRBM": String(subtotalGrupo["8º CRBM"]),
                  "9º CRBM": String(subtotalGrupo["9º CRBM"]),
                };

                return (
                  <React.Fragment key={grupo}>
                    {subgrupos.map((row, index) => (
                      <ReportRow key={row.subgrupo} row={row} crbmHeaders={crbmHeaders} isFirstInGroup={index === 0} groupSize={subgrupos.length} />
                    ))}
                    <ReportRow row={subtotalRow} crbmHeaders={crbmHeaders} isSubtotal />
                  </React.Fragment>
                )
              })}
            </tbody>
            <tfoot>
              <ReportRow row={totalGeralRow} crbmHeaders={crbmHeaders} isTotalGeral />
            </tfoot>
          </table>
        </div>
      )}
    </MainLayout>
  );
}

export default RelatorioPage;
