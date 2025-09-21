// Caminho: frontend/src/pages/RelatorioPage.tsx

import React, { useState } from 'react';
// Não precisamos mais de 'styled-components'
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';

// --- Componente Principal da Página ---

function RelatorioPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [reportData, setReportData] = useState<IRelatorioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleGenerateReport = async () => {
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
  };

  const groupedData = reportData.reduce((acc, row) => {
    const grupo = row.grupo;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  const crbmHeaders = ["1º CRBM", "2º CRBM", "3º CRBM", "4º CRBM", "5º CRBM", "6º CRBM", "7º CRBM", "8º CRBM", "9º CRBM"];

  const calculateTotals = () => {
    const totals: { [key: string]: number } = {
      diurno: 0, noturno: 0, total_capital: 0, total_geral: 0,
      "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0,
    };
    reportData.forEach(row => {
      (Object.keys(totals) as Array<keyof typeof totals>).forEach(key => {
        totals[key] += Number(row[key as keyof IRelatorioRow]) || 0;
      });
    });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <MainLayout pageTitle="Relatório Estatístico de Ocorrências">
      {/* FilterControls */}
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg bg-gray-800 p-6">
        {/* ControlGroup */}
        <div className="flex flex-col gap-2">
          <label htmlFor="data-inicio" className="text-sm text-gray-400">Data de Início</label>
          <input
            id="data-inicio"
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white"
          />
        </div>
        {/* ControlGroup */}
        <div className="flex flex-col gap-2">
          <label htmlFor="data-fim" className="text-sm text-gray-400">Data de Fim</label>
          <input
            id="data-fim"
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white"
          />
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {loading && <p className="text-center text-gray-400">Carregando relatório...</p>}

      {!loading && reportData.length > 0 && (
        // TableWrapper
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          {/* ReportTable */}
          <table className="min-w-[1600px] w-full border-collapse text-sm">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th rowSpan={2} className="sticky left-0 z-20 border-r border-gray-600 p-3 text-left w-[180px] bg-gray-700">GRUPO</th>
                <th rowSpan={2} className="sticky left-[180px] z-20 border-r border-gray-600 p-3 text-left w-[220px] bg-gray-700">NATUREZA (SUBGRUPO)</th>
                <th colSpan={3} className="border-b border-gray-600 p-3">ESTATÍSTICA CAPITAL</th>
                <th colSpan={9} className="border-b border-gray-600 p-3">ESTATÍSTICA POR CRBM (INTERIOR)</th>
                <th rowSpan={2} className="p-3">TOTAL GERAL</th>
              </tr>
              <tr>
                <th className="p-2">DIURNO</th>
                <th className="p-2">NOTURNO</th>
                <th className="p-2">TOTAL</th>
                {crbmHeaders.map(h => <th key={h} className="p-2">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  {subgrupos.map((row, index) => (
                    <tr key={`${grupo}-${row.subgrupo}`} className="border-b border-gray-700 text-center">
                      {index === 0 && (
                        <td rowSpan={subgrupos.length} className="sticky left-0 z-10 border-r border-gray-700 bg-gray-800 p-3 text-left align-middle font-bold">
                          {grupo}
                        </td>
                      )}
                      <td className="sticky left-[180px] z-10 border-r border-gray-700 bg-gray-800 p-3 text-left">
                        {row.subgrupo}
                      </td>
                      <td>{row.diurno}</td>
                      <td>{row.noturno}</td>
                      <td>{row.total_capital}</td>
                      {crbmHeaders.map(h => <td key={h}>{row[h as keyof IRelatorioRow]}</td>)}
                      <td>{row.total_geral}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {/* Linha de Total */}
              <tr className="sticky bottom-0 z-10 bg-blue-800 text-center font-bold text-white">
                <td colSpan={2} className="p-3 text-right">SUB TOTAL</td>
                <td>{totals.diurno}</td>
                <td>{totals.noturno}</td>
                <td>{totals.total_capital}</td>
                {crbmHeaders.map(h => <td key={h}>{totals[h]}</td>)}
                <td>{totals.total_geral}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}

export default RelatorioPage;
