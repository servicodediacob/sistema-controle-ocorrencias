// Caminho: frontend/src/components/DestaqueDetalhadoWidget.tsx

import React from 'react';
import { IOcorrenciaDetalhada } from '../services/ocorrenciaDetalhadaService';

interface DestaqueDetalhadoWidgetProps {
  destaque: IOcorrenciaDetalhada | null;
}

// Componente auxiliar para renderizar uma linha da tabela
const DetailRow: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
  <tr>
    <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">{label}</td>
    <td className="border border-gray-600 p-2" colSpan={2}>{value || 'Não informado'}</td>
  </tr>
);

const DestaqueDetalhadoWidget: React.FC<DestaqueDetalhadoWidgetProps> = ({ destaque }) => {
  // Se não houver ocorrência em destaque, exibe uma mensagem simples
  if (!destaque || !destaque.id) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-6 text-center text-text">
        <h3 className="text-lg font-semibold text-text-strong">Ocorrência de Destaque</h3>
        <p className="mt-4">Nenhuma ocorrência detalhada em destaque no momento.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-red-500 bg-surface text-text-strong">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th colSpan={3} className="bg-red-600 p-2 text-center font-bold uppercase text-white">
              Ocorrência de Destaque
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Linha para Número, Horário e Data */}
          <tr>
            <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">NÚMERO DA OCORRÊNCIA</td>
            <td className="border border-gray-600 p-2" colSpan={2}>
              <div className="grid grid-cols-3 items-center">
                <span className="col-span-2">{destaque.numero_ocorrencia || 'Não informado'}</span>
                <div className="col-span-1 flex items-center gap-2 border-l border-gray-600 pl-2">
                  <span className="bg-gray-700 p-1 text-xs font-bold">HORÁRIO:</span>
                  <span>{destaque.horario_ocorrencia?.substring(0, 5) || '--:--'}</span>
                </div>
                <div className="col-span-1 flex items-center gap-2 border-l border-gray-600 pl-2">
                  <span className="bg-gray-700 p-1 text-xs font-bold">DATA:</span>
                  <span>{new Date(destaque.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                </div>
              </div>
            </td>
          </tr>
          
          {/* Demais linhas */}
          <DetailRow label="GRUPO DA NATUREZA" value={(destaque as any).natureza_grupo} />
          <DetailRow label="NATUREZA" value={destaque.natureza_nome} />
          <DetailRow label="ENDEREÇO" value={destaque.endereco} />
          <DetailRow label="BAIRRO" value={destaque.bairro} />
          <DetailRow label="CIDADE" value={destaque.cidade_nome} />
          <DetailRow label="VIATURA(S)" value={destaque.viaturas} />
          <DetailRow label="VEÍCULO(S)" value={destaque.veiculos_envolvidos} />
          <DetailRow label="DADOS DA(S) VÍTIMA(S)" value={destaque.dados_vitimas} />
          <DetailRow label="RESUMO DA OCORRÊNCIA" value={destaque.resumo_ocorrencia} />
        </tbody>
      </table>
    </div>
  );
};

export default DestaqueDetalhadoWidget;
