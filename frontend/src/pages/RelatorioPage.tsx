import React, { useState } from 'react';
import { getRelatorio, IRelatorioRow } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import ReportRow from '../components/ReportRow'; // Importa o novo componente
import Spinner from '../components/Spinner';

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

  const totals = reportData.reduce((acc, row) => {
    (Object.keys(acc) as Array<keyof typeof acc>).forEach(key => {
      acc[key] += Number(row[key as keyof IRelatorioRow]) || 0;
    });
    return acc;
  }, { diurno: 0, noturno: 0, total_capital: 0, total_geral: 0, "1º CRBM": 0, "2º CRBM": 0, "3º CRBM": 0, "4º CRBM": 0, "5º CRBM": 0, "6º CRBM": 0, "7º CRBM": 0, "8º CRBM": 0, "9º CRBM": 0 });

  const totalInteriorGeral = crbmHeaders.reduce((acc, crbm) => acc + totals[crbm as keyof typeof totals], 0);

  return (
    <MainLayout pageTitle="Relatório Estatístico de Ocorrências">
      {/* Controles de Filtro (sem alteração) */}
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="data-inicio" className="text-sm text-gray-400">Data de Início</label>
          <input id="data-inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="data-fim" className="text-sm text-gray-400">Data de Fim</label>
          <input id="data-fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white" />
        </div>
        <button onClick={handleGenerateReport} disabled={loading} className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {loading && <div className="flex justify-center p-10"><Spinner text="Gerando relatório..." /></div>}

      {!loading && reportData.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full w-full border-collapse text-sm">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="sticky left-0 z-20 w-[250px] border-r border-gray-600 bg-gray-700 p-3 text-left">NATUREZA (SUBGRUPO)</th>
                {/* Cabeçalhos Desktop */}
                <th className="hidden lg:table-cell p-2">DIURNO</th>
                <th className="hidden lg:table-cell p-2">NOTURNO</th>
                <th className="p-2">TOTAL CAPITAL</th>
                {crbmHeaders.map(h => <th key={h} className="hidden lg:table-cell p-2">{h}</th>)}
                {/* Cabeçalho Mobile */}
                <th className="p-2 lg:hidden">TOTAL INTERIOR</th>
                <th className="p-2">TOTAL GERAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([grupo, subgrupos]) => (
                <React.Fragment key={grupo}>
                  <ReportRow row={{ grupo } as IRelatorioRow} isGroupHeader />
                  {subgrupos.map(row => (
                    <ReportRow key={row.subgrupo} row={row} crbmHeaders={crbmHeaders} />
                  ))}
                </React.Fragment>
              ))}
              {/* Linha de Total */}
              <tr className="sticky bottom-0 z-10 bg-blue-800 text-center font-bold text-white">
                <td className="sticky left-0 z-10 border-r border-gray-700 bg-blue-800 p-3 text-right">SUB TOTAL</td>
                <td className="hidden lg:table-cell">{totals.diurno}</td>
                <td className="hidden lg:table-cell">{totals.noturno}</td>
                <td>{totals.total_capital}</td>
                {crbmHeaders.map(h => <td key={h} className="hidden lg:table-cell">{totals[h as keyof typeof totals]}</td>)}
                <td className="lg:hidden">{totalInteriorGeral}</td>
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
