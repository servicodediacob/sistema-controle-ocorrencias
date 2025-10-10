// frontend/src/components/DestaqueWidget.tsx

import { useState, ReactElement } from 'react';
import { IPlantao, setOcorrenciaDestaque } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface DestaqueWidgetProps {
  // A propriedade foi corrigida de 'ocorrenciaDestaque' para 'ocorrenciasDestaque'
  // para corresponder à interface IPlantao.
  destaques: IPlantao['ocorrenciasDestaque'] | null;
  onUpdate: () => void;
}

function DestaqueWidget({ destaques, onUpdate }: DestaqueWidgetProps): ReactElement {
  const [ocorrenciaIdInput, setOcorrenciaIdInput] = useState<string>('');
  const { addNotification } = useNotification();

  const handleDefinirDestaque = async (): Promise<void> => {
    const idAsNumber = parseInt(ocorrenciaIdInput, 10);
    const id = ocorrenciaIdInput.trim() === '' ? null : idAsNumber;

    if (ocorrenciaIdInput.trim() !== '' && isNaN(idAsNumber)) {
      addNotification('Por favor, insira um ID de ocorrência válido.', 'error');
      return;
    }
    
    try {
      // A API espera o ID da ocorrência, que pode ser nulo para remover o destaque.
      await setOcorrenciaDestaque(id);
      addNotification(id ? `Ocorrência ${id} definida como destaque!` : 'Destaque removido.', 'success');
      onUpdate();
      setOcorrenciaIdInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao definir destaque.';
      addNotification(message, 'error');
    }
  };

  return (
    <div className="flex flex-col flex-1 rounded-lg bg-surface border border-border p-6 text-text min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Ocorrência de Destaque
      </h3>
      <div className="mt-4 flex-grow">
        {/* A lógica agora verifica se a lista de destaques não está vazia */}
        {destaques && destaques.length > 0 ? (
          <div className="bg-background p-4 rounded-md">
            {/* Exibe os dados do primeiro item da lista como destaque principal */}
            <p><strong className="text-text-strong">ID:</strong> {destaques[0].id}</p>
            <p><strong className="text-text-strong">Natureza:</strong> {destaques[0].natureza_nome}</p>
            <p><strong className="text-text-strong">OBM:</strong> {destaques[0].cidade_nome}</p>
          </div>
        ) : (
          <p>Nenhuma ocorrência em destaque.</p>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <input
          type="number"
          placeholder="ID da Ocorrência"
          value={ocorrenciaIdInput}
          onChange={(e) => setOcorrenciaIdInput(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background p-2 text-text-strong focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleDefinirDestaque}
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          Definir
        </button>
      </div>
    </div>
  );
}

export default DestaqueWidget;
