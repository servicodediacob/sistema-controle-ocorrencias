// Caminho: frontend/src/services/pdfGenerator.ts

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { IRelatorioCompleto } from './api';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const gerarPDFRelatorioCompleto = (
  dados: IRelatorioCompleto,
  dataInicio: string,
  dataFim: string
) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const periodo = `${new Date(dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;

  doc.setFontSize(18);
  doc.text('Relatório Consolidado de Ocorrências', 14, 22);
  doc.setFontSize(11);
  doc.text(`Período: ${periodo}`, 14, 30);
  doc.text(`Gerado em: ${dataFormatada}`, 14, 36);

  let finalY = 40;

  // ======================= INÍCIO DA CORREÇÃO =======================
  // Acessamos a propriedade 'finalY' do objeto retornado pela função autoTable
  
  if (dados.estatisticas.length > 0) {
    doc.setFontSize(14);
    doc.text('Relatório Estatístico', 14, finalY + 10);
    const crbmHeads = ['1?? CRBM','2?? CRBM','3?? CRBM','4?? CRBM','5?? CRBM','6?? CRBM','7?? CRBM','8?? CRBM','9?? CRBM'];
    const header = ['Natureza', 'Total Capital', ...crbmHeads, 'Total Geral'];
    doc.autoTable({
      startY: finalY + 15,
      head: [header],
      body: dados.estatisticas.map(item => [ item.subgrupo, item.total_capital, ...crbmHeads.map(h => (item as any)[h] ?? '0'), item.total_geral ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    styles: { fontSize: 9 }
    });
    // Versões atuais expõem o último Y em `doc.lastAutoTable`
    finalY = ((doc as unknown) as any).lastAutoTable?.finalY ?? finalY;
  }

  if (dados.obitos.length > 0) {
    doc.setFontSize(14);
    doc.text('Relatório de Óbitos', 14, finalY + 15);
    const crbmHeads = ['1?? CRBM','2?? CRBM','3?? CRBM','4?? CRBM','5?? CRBM','6?? CRBM','7?? CRBM','8?? CRBM','9?? CRBM'];
    const header = ['Grupo', 'Natureza', 'Diurno', 'Noturno', 'Total Capital', ...crbmHeads, 'Total Geral'];
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
  }

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
    // Rótulos em cinza claro
    const labelCell = { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold', fontSize: 10 } as const;
    const valueCell = { textColor: 20 } as const;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Ocorrências de Destaque', 10, finalY + 10);
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
            { content: formatTime((item as any).horario_ocorrencia), styles: valueCell },
            { content: 'DATA', styles: labelCell },
            { content: formatDate((item as any).data_ocorrencia), styles: valueCell },
          ],
          [
            { content: 'NÚMERO DA OCORRÊNCIA', styles: labelCell },
            { content: (item as any).numero_ocorrencia || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'GRUPO DA NATUREZA', styles: labelCell },
            { content: (item as any).natureza_grupo || (item as any).natureza?.grupo || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'ENDEREÇO', styles: labelCell },
            { content: (item as any).endereco || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'BAIRRO', styles: labelCell },
            { content: (item as any).bairro || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'CIDADE', styles: labelCell },
            { content: (item as any).cidade_nome || (item as any).obm_nome || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'VIATURA(S)', styles: labelCell },
            { content: (item as any).viaturas || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'VEÍCULO(S)', styles: labelCell },
            { content: (item as any).veiculos_envolvidos || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'DADOS DA(S) VÍTIMA(S)', styles: labelCell },
            { content: (item as any).dados_vitimas || '-', colSpan: 5, styles: valueCell },
          ],
          [
            { content: 'RESUMO DA OCORRÊNCIA', styles: labelCell },
            { content: (item as any).resumo_ocorrencia || '-', colSpan: 5, styles: valueCell },
          ],
        ],
      });
      finalY = ((doc as any).lastAutoTable?.finalY ?? startY);
    });
  }
  // ======================= FIM DA CORREÇÃO =======================

  doc.save(`relatorio_consolidado_${dataInicio}_a_${dataFim}.pdf`);
};
