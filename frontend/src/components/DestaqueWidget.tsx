import { useState, ReactElement } from 'react';
import styled from 'styled-components';
import { IPlantao, setOcorrenciaDestaque } from '../services/api';
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

const DestaqueInfo = styled.div`
  background: #3a3a3a;
  padding: 1rem;
  border-radius: 4px;
  p {
    margin: 0.5rem 0;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  /* Remove as setas do input number */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #3a7ca5;
  color: white;
`;

// --- Component ---
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
    <WidgetContainer>
      <Title>Ocorrência de Destaque</Title>
      <Content>
        {destaque?.ocorrencia_id ? (
          <DestaqueInfo>
            <p><strong>ID:</strong> {destaque.ocorrencia_id}</p>
            <p><strong>Natureza:</strong> {destaque.natureza_descricao}</p>
            <p><strong>OBM:</strong> {destaque.obm_nome}</p>
          </DestaqueInfo>
        ) : (
          <p>Nenhuma ocorrência em destaque.</p>
        )}
        <InputGroup>
          <Input
            type="number"
            placeholder="ID da Ocorrência (ou deixe em branco)"
            value={ocorrenciaIdInput}
            onChange={(e) => setOcorrenciaIdInput(e.target.value)}
          />
          <Button onClick={handleDefinirDestaque}>Definir</Button>
        </InputGroup>
      </Content>
    </WidgetContainer>
  );
}

export default DestaqueWidget;
