// Caminho: frontend/src/pages/RelatorioPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPlantaoRange } from '../utils/date';
import { IRelatorioRow, IObitoRegistro, IDestaqueRelatorio, IDataApoio, getNaturezas } from '../services/api';
import { getRelatorioCompleto, limparDadosPorIntervalo } from '../services/relatorioService';
import RelatorioObitosTable from '../components/RelatorioObitosTable';
import RelatorioDestaquesTable from '../components/RelatorioDestaquesTable';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthProvider';
import MainLayout from '../components/MainLayout';
import ReportRow from '../components/ReportRow';
import Spinner from '../components/Spinner';
import {
  gerarPDFRelatorioCompleto,
  gerarPDFRelatorioCompletoBlob,
} from '../services/pdfGeneratorService';
import { mergeEstatisticasWithNaturezas, CRBM_HEADERS } from '../utils/estatisticas';

import RelatorioEstatisticoCards from '../components/RelatorioEstatisticoCards'; // Import the new component
import RelatorioPreviewModal from '../components/RelatorioPreviewModal';
import { registrarGeracaoRelatorio } from '../services/auditoriaService';
import AssinaturaModal from '../components/AssinaturaModal';

function RelatorioPage() {
  const { inicioISO, fimISO } = getPlantaoRange();
  const [dataInicio, setDataInicio] = useState(inicioISO);
  const [dataFim, setDataFim] = useState(fimISO);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user: usuarioLogado } = useAuth();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [estatisticas, setEstatisticas] = useState<IRelatorioRow[]>([]);
  const [obitos, setObitos] = useState<IObitoRegistro[]>([]);
  const [destaques, setDestaques] = useState<IDestaqueRelatorio[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isAssinaturaModalOpen, setIsAssinaturaModalOpen] = useState(false);

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

  const formatPreviewDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const periodoLabel = useMemo(
    () => `Período: ${formatPreviewDate(dataInicio)} até ${formatPreviewDate(dataFim)}`,
    [dataInicio, dataFim],
  );

  const generatePreview = useCallback(async () => {
    setPreviewError(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setIsGeneratingPreview(true);
    try {
      const previewBlob = gerarPDFRelatorioCompletoBlob(
        { estatisticas, obitos, destaques },
        dataInicio,
        dataFim,
        { nome: usuarioLogado?.nome || '', funcao: usuarioLogado?.role || '' },
      );
      const url = URL.createObjectURL(previewBlob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('[RelatorioPage] Falha ao gerar o preview do relatório.', error);
      setPreviewError(
        error instanceof Error ? error.message : 'Falha ao gerar a pré-visualização do relatório.',
      );
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [estatisticas, obitos, destaques, dataInicio, dataFim, usuarioLogado]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewError(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const handleConfirmarLimpeza = useCallback(() => {
    setIsAssinaturaModalOpen(true);
  }, []);

  const handlePreviewConfirm = useCallback(() => {
    closePreview();
    handleConfirmarLimpeza();
  }, [closePreview, handleConfirmarLimpeza]);

  const handleDownloadPdf = () => {
    if (estatisticas.length === 0 && obitos.length === 0 && destaques.length === 0) {
      addNotification('Não há dados para gerar o PDF.', 'warning');
      return;
    }
    setIsPreviewOpen(true);
    generatePreview();
  };

  // Chamado pelo modal de assinatura para gerar o PDF e limpar os dados
  const handleConfirmarAssinatura = async (nome: string, funcao: string) => {
    let sucesso = false;
    try {
      setLoading(true);
      // 1. Gerar PDF
      gerarPDFRelatorioCompleto(
        { estatisticas, obitos, destaques },
        dataInicio,
        dataFim,
        { nome, funcao }
      );

      // Log report generation
      await registrarGeracaoRelatorio(
        usuarioLogado.id, 
        'Relatório Consolidado', 
        { dataInicio, dataFim }, 
        { nome: usuarioLogado?.nome || '', funcao: usuarioLogado?.role || '' }
      );

      // 2. Limpar dados
      await limparDadosPorIntervalo(dataInicio, dataFim);

      addNotification('Relatório gerado e dados limpos com sucesso!', 'success');

      // 3. Atualizar a UI
      await handleGenerateReport();
      sucesso = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar relatório e limpar dados.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
      if (sucesso) {
        setIsAssinaturaModalOpen(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
          <input id="data-inicio" type="datetime-local" value={dataInicio} onChange={e => {
            const newStart = new Date(e.target.value);
            const newEnd = new Date(newStart);
            newEnd.setDate(newEnd.getDate() + 1);
            const formatLocalDateTime = (date: Date) => {
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            };
            setDataInicio(e.target.value);
            setDataFim(formatLocalDateTime(newEnd));
          }} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label htmlFor="data-fim" className="text-sm text-text">Data de Fim</label>
          <input id="data-fim" type="datetime-local" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-md border border-border bg-background p-2.5 text-text-strong" />
        </div>
        <div className="flex flex-nowrap gap-4 mt-4 sm:mt-0 w-full justify-center sm:w-auto"> {/* New div for buttons */}
          <button onClick={handleGenerateReport} disabled={loading} className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto">
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
          <button onClick={handleDownloadPdf} disabled={loading} className="rounded-md bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto">
            Baixar PDF
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-10"><Spinner text="Gerando relatório..." /></div> : (
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-text-strong mb-4">Relatório Estatístico</h2>
            {estatisticas.length > 0 ? (
              <>
                {isMobile ? (
                  <RelatorioEstatisticoCards groupedData={groupedData} totals={totals} />
                ) : (
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
                )}
              </>
            ) : <p className="text-center text-text py-4">Nenhum dado estatístico para o período.</p>}
          </div>

          <RelatorioObitosTable obitos={obitos} />
          <RelatorioDestaquesTable destaques={destaques} />
        </div>
      )}

      <RelatorioPreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onRetry={generatePreview}
        onConfirm={handlePreviewConfirm}
        loading={loading}
        generatingPreview={isGeneratingPreview}
        previewUrl={previewUrl}
        previewError={previewError}
        periodoLabel={periodoLabel}
      />
      <AssinaturaModal
        isOpen={isAssinaturaModalOpen}
        onClose={() => setIsAssinaturaModalOpen(false)}
        onConfirm={handleConfirmarAssinatura}
        defaultNome={usuarioLogado?.nome || ''}
        defaultFuncao={usuarioLogado?.role || ''}
        loading={loading}
      />
    </MainLayout>
  );
}

export default RelatorioPage;

