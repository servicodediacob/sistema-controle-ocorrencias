// Caminho: frontend/src/services/pdfGeneratorService.ts

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { IRelatorioCompleto } from './api';
import { CRBM_HEADERS } from '../utils/estatisticas';

// Estende a interface do jsPDF para incluir o plugin autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface Assinatura {
  nome: string;
  funcao: string;
}

const buildRelatorioPdfDocument = (
  dados: IRelatorioCompleto,
  dataInicio: string,
  dataFim: string,
  assinatura: Assinatura
): jsPDFWithAutoTable => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const formatHeaderDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const periodo = `${formatHeaderDate(dataInicio)} – ${formatHeaderDate(dataFim)}`;

  // --- Cabeçalho ---
  doc.setFontSize(18);
  doc.text('Relatório Consolidado de Ocorrências', 14, 22);
  doc.setFontSize(11);
  doc.text(`Período: ${periodo}`, 14, 30);
  doc.text(`Gerado por: ${assinatura.nome}`, 14, 36);
  doc.text(`Gerado em: ${dataFormatada}`, 14, 42);

  let finalY = 46; // Posição inicial para o conteúdo

  // --- Tabela de Estatísticas ---
  if (dados.estatisticas.length > 0) {
    doc.setFontSize(14);
    doc.text('Relatório Estatístico', 14, finalY + 10);
    const crbmHeads = [...CRBM_HEADERS] as unknown as string[];
    const header = ['Natureza', 'Total Capital', ...crbmHeads, 'Total Geral'];
    const parseToNumber = (value: unknown): number => {
      const num = Number(typeof value === 'string' ? value.replace(/\./g, '').replace(',', '.') : value);
      return Number.isFinite(num) ? num : 0;
    };
    const totalCapital = dados.estatisticas.reduce(
      (acc, item) => acc + parseToNumber((item as any).total_capital),
      0,
    );
    const totalPorCrbm = crbmHeads.map((headerKey) =>
      dados.estatisticas.reduce((acc, item) => acc + parseToNumber((item as any)[headerKey]), 0),
    );
    const totalGeral = dados.estatisticas.reduce(
      (acc, item) => acc + parseToNumber((item as any).total_geral),
      0,
    );
    doc.autoTable({
      startY: finalY + 15,
      head: [header],
      body: dados.estatisticas.map(item => [
        item.subgrupo,
        item.total_capital,
        ...crbmHeads.map(h => (item as any)[h] ?? '0'),
        item.total_geral,
      ]),
      foot: [[
        'TOTAL GERAL',
        String(totalCapital),
        ...totalPorCrbm.map(total => String(total)),
        String(totalGeral),
      ]],
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      columnStyles: {
        0: { halign: 'left' },
        ...Object.fromEntries(header.slice(1).map((_, idx) => [idx + 1, { halign: 'center' }])),
      },
      styles: { fontSize: 9 },
      footStyles: {
        fillColor: [255, 255, 0],
        textColor: 0,
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold',
      },
    });
    finalY = ((doc as unknown) as any).lastAutoTable?.finalY ?? finalY;
  }

  // --- Tabela de Óbitos ---
  if (dados.obitos.length > 0) {
    doc.setFontSize(14);
    doc.text('Relatório de Óbitos', 14, finalY + 15);
    doc.autoTable({
      startY: finalY + 20,
      head: [['Data', 'Natureza', 'RAI', 'OBM', 'Vítimas']],
      body: dados.obitos.map(item => [
        new Date(item.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        item.natureza_nome,
        item.numero_ocorrencia,
        item.obm_nome,
        item.quantidade_vitimas
      ]),
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43] },
    });
    finalY = ((doc as unknown) as any).lastAutoTable?.finalY ?? finalY;
    const totalObitos = (dados as any).totalObitos ?? dados.obitos.length;
    doc.setFontSize(11);
    doc.text(`Total de Óbitos: ${totalObitos}`, 14, finalY + 5);
    finalY += 5;
  }

  // --- Tabela de Destaques ---
  if (dados.destaques.length > 0) {
    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';
    const formatTime = (t: any) => {
      if (!t) return '-';
      if (typeof t === 'string') {
        const m = t.match(/(\d{2}):(\d{2})/);
        if (m) return `${m[1]}:${m[2]}`;
        const dt = new Date(t);
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
        }
        return t;
      }
      if (t instanceof Date) {
        return t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return String(t);
    };
    const labelCell = { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold', fontSize: 10 } as const;
    const valueCell = { textColor: 20 } as const;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Ocorrências de Destaque', 14, finalY + 10);
    finalY += 10;

    dados.destaques.forEach((item, index) => {
      const startY = finalY + (index === 0 ? 5 : 10);
      (doc as any).autoTable({
        startY,
        head: [[{ content: 'OCORRÊNCIAS DETALHADAS DO DIA', colSpan: 6 }]],
        headStyles: { fillColor: [185, 28, 28], textColor: 255, halign: 'center', fontStyle: 'bold' },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 33 }, 1: { cellWidth: 27 },
          2: { cellWidth: 33 }, 3: { cellWidth: 27 },
          4: { cellWidth: 33 }, 5: { cellWidth: 27 },
        },
        body: [
          [
            { content: 'NATUREZA DA OCORRÊNCIA', styles: labelCell },
            { content: (item as any).natureza_nome || (item as any).natureza_descricao || (item as any).natureza?.subgrupo || '-', styles: valueCell },
            { content: 'HORÁRIO', styles: labelCell },
            { content: formatTime(item.horario_ocorrencia), styles: valueCell },
            { content: 'DATA', styles: labelCell },
            { content: formatDate(item.data_ocorrencia), styles: valueCell },
          ],
          [
            { content: 'GRUPO DA NATUREZA', styles: labelCell },
            { content: (item as any).natureza_grupo || (item as any).natureza?.grupo || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'ENDEREÇO', styles: labelCell },
            { content: item.endereco || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'BAIRRO', styles: labelCell },
            { content: item.bairro || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'CIDADE', styles: labelCell },
            { content: (item as any).cidade_nome || (item as any).obm_nome || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'VIATURA(S)', styles: labelCell },
            { content: item.viaturas || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'VEÍCULO(S)', styles: labelCell },
            { content: item.veiculos_envolvidos || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'DADOS DA(S) VÍTIMA(S)', styles: labelCell },
            { content: item.dados_vitimas || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'RESUMO DA OCORRÊNCIA', styles: labelCell },
            { content: item.resumo_ocorrencia || '-', colSpan: 5, styles: valueCell },
          ],
        ],
      });
      finalY = ((doc as any).lastAutoTable?.finalY ?? startY);
    });
  }

  // --- Assinatura ---
  const signatureY = finalY + 40;
  doc.line(60, signatureY, 150, signatureY); // Linha da assinatura
  doc.setFontSize(10);
  doc.text(assinatura.nome, 105, signatureY + 5, { align: 'center' });
  doc.text(assinatura.funcao, 105, signatureY + 10, { align: 'center' });

  return doc;
};

export const gerarPDFRelatorioCompleto = (
  dados: IRelatorioCompleto,
  dataInicio: string,
  dataFim: string,
  assinatura: Assinatura
) => {
  const doc = buildRelatorioPdfDocument(dados, dataInicio, dataFim, assinatura);
  doc.save(`relatorio_consolidado_${dataInicio}_a_${dataFim}.pdf`);
};

export const gerarPDFRelatorioCompletoBlob = (
  dados: IRelatorioCompleto,
  dataInicio: string,
  dataFim: string,
  assinatura: Assinatura
): Blob => {
  const doc = buildRelatorioPdfDocument(dados, dataInicio, dataFim, assinatura);
  return doc.output('blob');
};
