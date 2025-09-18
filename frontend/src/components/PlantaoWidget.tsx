import React, { useState, useEffect, ReactElement } from 'react';
import styled from 'styled-components';
import { IPlantao, ISupervisor, getSupervisores, setSupervisorPlantao } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// --- Styled Components ---
const WidgetContainer = styled.div`
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 8px;
  flex: 1;
  min-width: 300px;
`;

const Title = styled.h3`
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
`;

const Content = styled.div`
  margin-top: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  margin-top: 1rem;
`;

// --- Component ---
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
    <WidgetContainer>
      <Title>Supervisor de Plantão</Title>
      <Content>
        <p>
          <strong>Atual:</strong> {supervisor?.supervisor_nome || 'Nenhum supervisor definido'}
        </p>
        <Select
          value={selectedSupervisor}
          onChange={handleSelectChange}
        >
          <option value="">-- Selecione para assumir/liberar --</option>
          {supervisoresList.map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </Select>
      </Content>
    </WidgetContainer>
  );
}

export default PlantaoWidget;
