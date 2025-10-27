// frontend/src/components/ObmCards.tsx

import React from 'react';
import { IObm } from '../services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ObmCardsProps {
  obmsAgrupadas: Record<string, IObm[]>;
  handleOpenModal: (item: IObm) => void;
  handleDelete: (id: number) => void;
}

const ObmCards: React.FC<ObmCardsProps> = ({ obmsAgrupadas, handleOpenModal, handleDelete }) => {
  const [openCrbmGroups, setOpenCrbmGroups] = React.useState<Record<string, boolean>>({});

  const toggleCrbmGroup = (crbmNome: string) => {
    setOpenCrbmGroups(prev => ({ ...prev, [crbmNome]: !prev[crbmNome] }));
  };

  return (
    <div className="space-y-4">
      {Object.entries(obmsAgrupadas).map(([crbmNome, listaObms]) => (
        <div key={crbmNome} className="rounded-lg border border-border bg-surface-dark shadow-md">
          <button
            className="flex w-full items-center justify-between p-4 text-lg font-semibold text-text-strong"
            onClick={() => toggleCrbmGroup(crbmNome)}
          >
            CRBM: {crbmNome}
            {openCrbmGroups[crbmNome] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {openCrbmGroups[crbmNome] && (
            <div className="border-t border-border p-4 space-y-3">
              {listaObms.map(obm => (
                <div key={obm.id} className="rounded-md bg-surface border border-border p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-text-strong">{obm.cidade_nome}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(obm)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                      <button onClick={() => handleDelete(obm.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ObmCards;
