// frontend/src/components/PlantaoWidget.tsx

import React, { useState, useEffect, ReactElement } from 'react';
import { IPlantao, ISupervisor, getSupervisores, setSupervisorPlantao } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface PlantaoWidgetProps {
  supervisor: IPlantao['supervisorPlantao'] | null;
  onUpdate: () => void;
}

function PlantaoWidget({ supervisor, onUpdate }: PlantaoWidgetProps): ReactElement {
  const [supervisoresList, setSupervisoresList] = useState<ISupervisor[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchSupervisores = async () => {
      try {
        const data = await getSupervisores();
        setSupervisoresList(data);
      } catch (error) {
        console.error("Falha ao buscar lista de supervisores", error);
      }
    };
    fetchSupervisores();
  }, []);
  
  useEffect(() => {
    setSelectedSupervisor(supervisor?.usuario_id?.toString() || '');
  }, [supervisor]);

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const selectedId = e.target.value;
    setSelectedSupervisor(selectedId);
    
    const idParaApi = selectedId === '' ? null : parseInt(selectedId, 10);

    try {
      await setSupervisorPlantao(idParaApi);
      addNotification('Supervisor de plantão atualizado!', 'success');
      onUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao definir supervisor.";
      addNotification(message, 'error');
    }
  };

  return (
    // CORREÇÃO: Adicionado 'flex flex-col'.
    <div className="flex flex-col flex-1 rounded-lg bg-surface border border-border p-6 text-text min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Supervisor de Plantão
      </h3>
      {/* CORREÇÃO: Adicionado 'flex-grow'. */}
      <div className="mt-4 flex-grow">
        <p>
          <strong className="text-text-strong">Atual:</strong> {supervisor?.supervisor_nome || 'Nenhum supervisor definido'}
        </p>
      </div>
      <select
        value={selectedSupervisor}
        onChange={handleSelectChange}
        className="mt-4 w-full rounded-md border border-border bg-background p-3 text-text-strong focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Selecione para assumir/liberar --</option>
        {supervisoresList.map(s => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
    </div>
  );
}

export default PlantaoWidget;
