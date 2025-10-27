// frontend/src/components/OcorrenciaDetalhadaCards.tsx

import React from 'react';
import { IOcorrenciaDetalhada } from '../services/ocorrenciaDetalhadaService';
import Icon from './Icon'; // Assuming Icon component is available

interface OcorrenciaDetalhadaCardsProps {
  ocorrencias: IOcorrenciaDetalhada[];
  setOcorrenciaParaVisualizar: (ocorrencia: IOcorrenciaDetalhada | null) => void;
  setOcorrenciaParaEditar: (ocorrencia: IOcorrenciaDetalhada | null) => void;
  setIsDetalheModalOpen: (isOpen: boolean) => void;
  handleDeleteDetalhada: (id: number) => void;
}

const OcorrenciaDetalhadaCards: React.FC<OcorrenciaDetalhadaCardsProps> = ({
  ocorrencias,
  setOcorrenciaParaVisualizar,
  setOcorrenciaParaEditar,
  setIsDetalheModalOpen,
  handleDeleteDetalhada,
}) => {
  if (ocorrencias.length === 0) {
    return (
      <p className="p-8 text-center text-gray-500">Nenhuma ocorrência detalhada lançada para esta data.</p>
    );
  }

  return (
    <div className="space-y-4">
      {ocorrencias.map(item => (
        <div key={item.id} className="rounded-lg border border-border bg-surface p-4 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-lg font-semibold text-text-strong">{item.natureza_nome}</p>
              <p className="text-sm text-text-light">{item.horario_ocorrencia?.substring(0, 5) || '--:--'} - {item.cidade_nome}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOcorrenciaParaVisualizar(item)} title="Visualizar" className="text-blue-400 hover:text-blue-300">
                <Icon path="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" size={20} />
              </button>
              <button onClick={() => { setOcorrenciaParaEditar(item); setIsDetalheModalOpen(true); }} title="Editar" className="text-yellow-400 hover:text-yellow-300">
                <Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" size={20} />
              </button>
              <button onClick={() => handleDeleteDetalhada(item.id)} title="Excluir" className="text-red-500 hover:text-red-400">
                <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" size={20} />
              </button>
            </div>
          </div>
          <p className="text-sm text-text max-w-full truncate" title={item.resumo_ocorrencia}>
            <strong>Resumo:</strong> {item.resumo_ocorrencia}
          </p>
          {item.endereco && (
            <p className="text-sm text-text"><strong>Endereço:</strong> {item.endereco}</p>
          )}
          {item.bairro && (
            <p className="text-sm text-text"><strong>Bairro:</strong> {item.bairro}</p>
          )}
          {item.viaturas && (
            <p className="text-sm text-text"><strong>Viaturas:</strong> {item.viaturas}</p>
          )}
          {item.veiculos_envolvidos && (
            <p className="text-sm text-text"><strong>Veículos:</strong> {item.veiculos_envolvidos}</p>
          )}
          {item.dados_vitimas && (
            <p className="text-sm text-text"><strong>Vítimas:</strong> {item.dados_vitimas}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default OcorrenciaDetalhadaCards;
