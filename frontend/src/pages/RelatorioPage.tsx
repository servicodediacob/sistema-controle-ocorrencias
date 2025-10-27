// Caminho: frontend/src/pages/RelatorioPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { IRelatorioRow, IObitoRegistro, IDestaqueRelatorio, IDataApoio, getNaturezas } from '../services/api';
import { getRelatorioCompleto } from '../services/relatorioService';
import RelatorioObitosTable from '../components/RelatorioObitosTable';
import RelatorioDestaquesTable from '../components/RelatorioDestaquesTable';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthProvider';
import MainLayout from '../components/MainLayout';
import ReportRow from '../components/ReportRow';
import Spinner from '../components/Spinner';
import { gerarPDFRelatorioCompleto } from '../services/pdfGeneratorService';
import { mergeEstatisticasWithNaturezas, CRBM_HEADERS } from '../utils/estatisticas';
import AssinaturaModal from '../components/AssinaturaModal'; // Importar o modal

function RelatorioPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user: usuarioLogado } = useAuth();

  const [estatisticas, setEstatisticas] = useState<IRelatorioRow[]>([]);
  const [obitos, setObitos] = useState<IObitoRegistro[]>([]);
  const [destaques, setDestaques] = useState<IDestaqueRelatorio[]>([]);
  const [isAssinaturaModalOpen, setAssinaturaModalOpen] = useState(false); // Estado para o modal

  const handleGenerateReport = useCallback(async () => {
    try {
      setLoading(true);
      const [relatorioData, naturezasData] = await Promise.all([
        getRelatorioCompleto(dataInicio, dataFim),
        getNaturezas().catch((error): IDataApoio[] => {
          console.error('[RelatorioPage] Falha ao buscar naturezas:', error);
          return [];
        }),
      ]);

      const estatisticasCompletas = mergeEstatisticasWithNaturezas(
        relatorioData.estatisticas,
        naturezasData,
      );

      setEstatisticas(estatisticasCompletas);
      setObitos(relatorioData.obitos);
      setDestaques(relatorioData.destaques);

      if (
        estatisticasCompletas.length === 0 &&
        relatorioData.obitos.length === 0 &&
        relatorioData.destaques.length === 0
      ) {
        addNotification('Nenhum dado encontrado para o período selecionado.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar relatório.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, addNotification]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  // Abre o modal
  const handleDownloadPdf = () => {
    if (estatisticas.length === 0 && obitos.length === 0 && destaques.length === 0) {
      addNotification('Não há dados para gerar o PDF.', 'warning');
      return;
    }
    setAssinaturaModalOpen(true);
  };

  // Chamado pelo modal para gerar o PDF
  const handleConfirmarAssinatura = (nome: string, funcao: string) => {
    gerarPDFRelatorioCompleto(
      { estatisticas, obitos, destaques },
      dataInicio,
      dataFim,
      { nome, funcao }
    );
    setAssinaturaModalOpen(false);
  };

  const groupedData = estatisticas.reduce((acc, row) => {
    const grupo = row.grupo;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(row);
    return acc;
  }, {} as Record<string, IRelatorioRow[]>);

  type Totais = Record<'diurno' | 'noturno' | 'total_capital' | 'total_geral', number> &
    Record<typeof CRBM_HEADERS[number], number>;

  const criarTotaisIniciais = (): Totais => {
    const base: Record<string, number> = {
      diurno: 0,
      noturno: 0,
      total_capital: 0,
      total_geral: 0,
    };

    CRBM_HEADERS.forEach((header) => {
      base[header] = 0;
    });

    return base as Totais;
  };

  const totals = estatisticas.reduce((acc, row) => {
    acc.diurno += Number(row.diurno) || 0;
    acc.noturno += Number(row.noturno) || 0;
    acc.total_capital += Number(row.total_capital) || 0;
    acc.total_geral += Number(row.total_geral) || 0;

    CRBM_HEADERS.forEach((header) => {
      acc[header] += Number(row[header]) || 0;
    });

    return acc;
  }, criarTotaisIniciais());

  const totalCrbmValues = CRBM_HEADERS.reduce((acc, header) => {
    acc[header] = String(totals[header]);
    return acc;
  }, {} as Record<typeof CRBM_HEADERS[number], string>);

  const totalGeralRow: IRelatorioRow = {
    grupo: 'TOTAL GERAL',
    subgrupo: 'TOTAL GERAL',
    diurno: String(totals.diurno),
    noturno: String(totals.noturno),
    total_capital: String(totals.total_capital),
    total_geral: String(totals.total_geral),
    ...totalCrbmValues,
  };

  return (
    <MainLayout pageTitle="Central de Relatórios">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-4 rounded-lg bg-surface border border-border p-6">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label htmlFor="data-inicio" className="text-sm text-text">Data de Início</label>
          <input id="data-inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label htmlFor="data-fim" className="text-sm text-text">Data de Fim</label>
          <input id="data-fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4 sm:mt-0"> {/* New div for buttons */}
          <button onClick={handleGenerateReport} disabled={loading} className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
          <button onClick={handleDownloadPdf} disabled={loading} className="rounded-md bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            Baixar PDF
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-10"><Spinner text="Gerando relatório..." /></div> : (
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-text-strong mb-4">Relatório Estatístico</h2>
            {estatisticas.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
                <table className="min-w-full w-full border-collapse text-sm">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-text-strong">
                    <tr>
                      <th className="sticky left-0 top-0 z-20 w-[250px] border-r border-border bg-surface p-3 text-left">GRUPO</th>
                      <th className="sticky left-[250px] top-0 z-20 w-[250px] border-r border-border bg-surface p-3 text-left">NATUREZA (SUBGRUPO)</th>
                      <th className="hidden lg:table-cell p-2">DIURNO</th>
                      <th className="hidden lg:table-cell p-2">NOTURNO</th>
                      <th className="p-2">TOTAL CAPITAL</th>
                      {CRBM_HEADERS.map(h => <th key={h} className="hidden lg:table-cell p-2">{h}</th>)}
                      <th className="p-2 lg:hidden">TOTAL INTERIOR</th>
                      <th className="p-2">TOTAL GERAL</th>
                    </tr>
                  </thead>
                  <tbody>
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

                      const subtotalCrbmValues = CRBM_HEADERS.reduce((acc, header) => {
                        acc[header] = String(subtotalGrupo[header]);
                        return acc;
                      }, {} as Record<typeof CRBM_HEADERS[number], string>);

                      const subtotalRow: IRelatorioRow = {
                        grupo: grupo,
                        subgrupo: 'SUB TOTAL',
                        diurno: String(subtotalGrupo.diurno),
                        noturno: String(subtotalGrupo.noturno),
                        total_capital: String(subtotalGrupo.total_capital),
                        total_geral: String(subtotalGrupo.total_geral),
                        ...subtotalCrbmValues,
                      };

                      return (
                        <React.Fragment key={grupo}>
                          {subgrupos.map((row, index) => (
                            <ReportRow key={row.subgrupo} row={row} crbmHeaders={CRBM_HEADERS} isFirstInGroup={index === 0} groupSize={subgrupos.length} />
                          ))}
                          <ReportRow row={subtotalRow} crbmHeaders={CRBM_HEADERS} isSubtotal />
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <ReportRow row={totalGeralRow} crbmHeaders={CRBM_HEADERS} isTotalGeral />
                  </tfoot>
                </table>
              </div>
            ) : <p className="text-center text-text py-4">Nenhum dado estatístico para o período.</p>}
          </div>

          <RelatorioObitosTable obitos={obitos} />
          <RelatorioDestaquesTable destaques={destaques} />
        </div>
      )}

      <AssinaturaModal
        isOpen={isAssinaturaModalOpen}
        onClose={() => setAssinaturaModalOpen(false)}
        onConfirm={handleConfirmarAssinatura}
        defaultNome={usuarioLogado?.nome}
      />
    </MainLayout>
  );
}

export default RelatorioPage;




