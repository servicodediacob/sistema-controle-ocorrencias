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
    doc.autoTable({
      startY: finalY + 15,
      head: [['Grupo', 'Natureza', 'Total Capital', 'Total Geral']],
      body: dados.estatisticas.map(item => [item.grupo, item.subgrupo, item.total_capital, item.total_geral]),
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    });
    finalY = (doc.autoTable as any).last.finalY; // Maneira correta de obter a posição Y
  }

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
    finalY = (doc.autoTable as any).last.finalY; // Maneira correta de obter a posição Y
  }

  if (dados.destaques.length > 0) {
    doc.setFontSize(14);
    doc.text('Ocorrências de Destaque', 14, finalY + 15);
    doc.autoTable({
      startY: finalY + 20,
      head: [['ID', 'Data', 'Natureza', 'OBM']],
      body: dados.destaques.map(item => [
        item.id,
        new Date(item.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        item.natureza_descricao,
        item.obm_nome
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
  }
  // ======================= FIM DA CORREÇÃO =======================

  doc.save(`relatorio_consolidado_${dataInicio}_a_${dataFim}.pdf`);
};
