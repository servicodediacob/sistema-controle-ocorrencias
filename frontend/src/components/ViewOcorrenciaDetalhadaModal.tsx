// Caminho: frontend/src/components/ViewOcorrenciaDetalhadaModal.tsx

import React from 'react';
import { IOcorrenciaDetalhada } from '../services/ocorrenciaDetalhadaService';
import Icon from './Icon';

interface ViewOcorrenciaDetalhadaModalProps {
  ocorrencia: IOcorrenciaDetalhada;
  onClose: () => void;
}

// Componente auxiliar para exibir um campo de dado
const DetailField: React.FC<{ label: string; value: string | undefined | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-gray-400">{label}</p>
      <p className="text-text-strong whitespace-pre-wrap">{value}</p>
    </div>
  );
};

const ViewOcorrenciaDetalhadaModal: React.FC<ViewOcorrenciaDetalhadaModalProps> = ({ ocorrencia, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div 
        className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-surface text-text shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold text-text-strong">Detalhes da Ocorrência</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" size={28} />
          </button>
        </div>
        
        <div className="flex-grow space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailField label="Data" value={new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
            <DetailField label="Horário" value={ocorrencia.horario_ocorrencia?.substring(0, 5)} />
            <DetailField label="Nº Ocorrência (RAI)" value={ocorrencia.numero_ocorrencia} />
          </div>
          <DetailField label="Natureza" value={ocorrencia.natureza_nome} />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Cidade (OBM)" value={ocorrencia.cidade_nome} />
            <DetailField label="Bairro" value={ocorrencia.bairro} />
          </div>
          <DetailField label="Endereço" value={ocorrencia.endereco} />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Viatura(s)" value={ocorrencia.viaturas} />
            <DetailField label="Veículo(s) Envolvido(s)" value={ocorrencia.veiculos_envolvidos} />
          </div>
          <DetailField label="Dados da(s) Vítima(s)" value={ocorrencia.dados_vitimas} />
          <DetailField label="Resumo da Ocorrência" value={ocorrencia.resumo_ocorrencia} />
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-4 border-t border-border p-4">
          <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOcorrenciaDetalhadaModal;
