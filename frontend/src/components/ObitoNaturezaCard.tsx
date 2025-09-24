// Caminho: frontend/src/components/ObitoNaturezaCard.tsx

import React from 'react';
import { IObitoRegistro } from '../services/api';

// Define a interface para os dados que o card vai receber
interface ObitoData {
  // A propriedade 'nome' pode ser string ou undefined, como apontado pelo erro.
  nome: string | undefined; 
  quantidade: number;
  registros: IObitoRegistro[];
}

// Define a interface para as props do componente
interface ObitoNaturezaCardProps {
  item: ObitoData;
  onEditClick: (registro: IObitoRegistro) => void;
}

const ObitoNaturezaCard: React.FC<ObitoNaturezaCardProps> = ({ item, onEditClick }) => {
  // Não renderiza o card se não houver óbitos ou se o nome não estiver definido.
  if (item.quantidade === 0 || !item.nome) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      {/* Cabeçalho do Card: Nome da Natureza e Quantidade Total */}
      <div className="flex items-center justify-between">
        {/* CORREÇÃO: Usamos um fallback caso item.nome seja undefined */}
        <span className="font-bold text-white">{item.nome || 'Natureza Desconhecida'}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
          {item.quantidade}
        </span>
      </div>

      {/* Lista de Registros Detalhados (só aparece se houver registros) */}
      {item.registros.length > 0 && (
        <div className="mt-4 border-t border-gray-600 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Registros Individuais</p>
          <ul className="space-y-2">
            {item.registros.map((r) => (
              <li
                key={r.id}
                onClick={() => onEditClick(r)}
                className="cursor-pointer rounded-md bg-gray-700/50 p-2 text-sm text-cyan-400 transition-colors hover:bg-gray-700"
              >
                {/* Informações formatadas para melhor leitura */}
                <div className="flex justify-between">
                  {/* CORREÇÃO: Usamos 'obm_nome' que vem da API */}
                  <span>RAI: <span className="font-mono">{r.numero_ocorrencia || 'N/A'}</span></span>
                  <span className="font-bold">({r.quantidade_vitimas})</span>
                </div>
                <div className="text-xs text-gray-500">{r.obm_nome || 'OBM não informada'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ObitoNaturezaCard;
