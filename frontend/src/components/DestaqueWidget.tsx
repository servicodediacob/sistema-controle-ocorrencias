// Caminho: frontend/src/components/DestaqueWidget.tsx

import { useState, ReactElement } from 'react';
import { IPlantao, setOcorrenciaDestaque } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface DestaqueWidgetProps {
  destaque: IPlantao['ocorrenciaDestaque'] | null;
  onUpdate: () => void;
}

function DestaqueWidget({ destaque, onUpdate }: DestaqueWidgetProps): ReactElement {
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
    // ======================= CORREÇÃO APLICADA =======================
    <div className="flex-1 rounded-lg bg-surface border border-border p-6 text-text min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Ocorrência de Destaque
      </h3>
      <div className="mt-4">
        {destaque?.ocorrencia_id ? (
          <div className="bg-background p-4 rounded-md">
            <p><strong className="text-text-strong">ID:</strong> {destaque.ocorrencia_id}</p>
            <p><strong className="text-text-strong">Natureza:</strong> {destaque.natureza_descricao}</p>
            <p><strong className="text-text-strong">OBM:</strong> {destaque.obm_nome}</p>
          </div>
        ) : (
          <p>Nenhuma ocorrência em destaque.</p>
        )}
        <div className="flex gap-2 mt-4">
          <input
            type="number"
            placeholder="ID da Ocorrência"
            value={ocorrenciaIdInput}
            onChange={(e) => setOcorrenciaIdInput(e.target.value)}
            className="flex-1 rounded-md border border-border bg-surface p-2 text-text-strong focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleDefinirDestaque}
            className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            Definir
          </button>
        </div>
      </div>
    </div>
  );
}

export default DestaqueWidget;
