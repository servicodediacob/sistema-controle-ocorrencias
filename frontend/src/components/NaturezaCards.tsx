// frontend/src/components/NaturezaCards.tsx

import React from 'react';
import { IDataApoio } from '../services/api';

interface NaturezaCardsProps {
  naturezas: IDataApoio[];
  handleOpenModal: (item: IDataApoio) => void;
  handleDelete: (id: number) => void;
}

const NaturezaCards: React.FC<NaturezaCardsProps> = ({ naturezas, handleOpenModal, handleDelete }) => {
  return (
    <div className="space-y-4">
      {naturezas.map(item => (
        <div key={item.id} className="rounded-lg border border-border bg-surface-dark shadow-md p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-lg font-semibold text-text-strong">{item.grupo}</p>
              <p className="text-md text-text">{item.subgrupo}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal(item)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
              <button onClick={() => handleDelete(item.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
            </div>
          </div>
          {item.abreviacao && (
            <p className="text-sm text-text"><strong>Abreviação:</strong> {item.abreviacao}</p>
          )}
          {item.descricao && (
            <p className="text-sm text-text"><strong>Descrição:</strong> {item.descricao}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default NaturezaCards;
