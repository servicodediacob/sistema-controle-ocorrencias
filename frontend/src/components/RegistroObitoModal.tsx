import { useState, useEffect, ReactElement } from 'react';
import styled from 'styled-components';
import { IDataApoio, IObitoRegistroPayload } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { device } from '../styles/theme';

// --- Styled Components (sem alterações) ---
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.7); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
  padding: 1rem; box-sizing: border-box;
`;
const ModalContent = styled.div`
  background-color: #2c2c2c; padding: 2rem; border-radius: 8px; 
  width: 450px; max-width: 100%; color: white; box-sizing: border-box;
  @media ${device.tablet} { width: 95%; padding: 1.5rem; }
`;
const ModalTitle = styled.h2` 
  margin-top: 0; font-size: 1.5rem;
  @media ${device.mobileL} { font-size: 1.2rem; }
`;
const Form = styled.form` display: flex; flex-direction: column; gap: 1rem; `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; `;
const Label = styled.label``;
const Input = styled.input`
  padding: 0.75rem; background-color: #3a3a3a;
  border: 1px solid #555; color: white; border-radius: 4px;
`;
const Select = styled.select`
  padding: 0.75rem; background-color: #3a3a3a;
  border: 1px solid #555; color: white; border-radius: 4px;
`;
const ButtonContainer = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
  @media ${device.mobileL} {
    flex-direction: column-reverse;
    button { width: 100%; }
  }
`;
const Button = styled.button`
  padding: 0.75rem 1.5rem; border: none; border-radius: 4px;
  cursor: pointer; font-size: 1rem;
`;
const SaveButton = styled(Button)` background-color: #3a7ca5; color: white; `;
const CancelButton = styled(Button)` background-color: #555; color: white; `;

// --- Props Interface ---
interface RegistroObitoModalProps {
  isOpen: boolean;
  dataOcorrencia: string;
  naturezas: IDataApoio[];
  onClose: () => void;
  onSave: (formData: IObitoRegistroPayload) => void;
}

// --- Componente Principal ---
function RegistroObitoModal({ isOpen, dataOcorrencia, naturezas, onClose, onSave }: RegistroObitoModalProps): ReactElement | null {
  const [formData, setFormData] = useState<IObitoRegistroPayload>({
    data_ocorrencia: dataOcorrencia,
    natureza_id: 0,
    numero_ocorrencia: '',
    obm_responsavel: '',
    quantidade_vitimas: 1,
  });
  const { addNotification } = useNotification();

  // --- CORREÇÃO APLICADA AQUI ---
  // Este useEffect garante que o estado do formulário seja resetado com os
  // dados corretos toda vez que o modal for aberto.
  useEffect(() => {
    if (isOpen) {
      setFormData({
        data_ocorrencia: dataOcorrencia,
        natureza_id: naturezas.length > 0 ? naturezas[0].id : 0,
        numero_ocorrencia: '',
        obm_responsavel: '',
        quantidade_vitimas: 1,
      });
    }
  }, [isOpen, dataOcorrencia, naturezas]); // Dependências que disparam a atualização

  // Se o modal não deve estar aberto, não renderiza nada.
  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'natureza_id' || name === 'quantidade_vitimas' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue as any }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.natureza_id === 0) {
      addNotification('Por favor, selecione uma natureza.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>Registro de Óbitos</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="natureza_id">Natureza</Label>
            <Select id="natureza_id" name="natureza_id" value={formData.natureza_id} onChange={handleChange} required>
              <option value={0} disabled>Selecione uma natureza</option>
              {naturezas.map(n => <option key={n.id} value={n.id}>{n.subgrupo}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="numero_ocorrencia">Número da Ocorrência (RAI)</Label>
            <Input id="numero_ocorrencia" name="numero_ocorrencia" value={formData.numero_ocorrencia} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="obm_responsavel">OBM Responsável</Label>
            <Input id="obm_responsavel" name="obm_responsavel" value={formData.obm_responsavel} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="quantidade_vitimas">Quantidade de Vítimas</Label>
            <Input id="quantidade_vitimas" name="quantidade_vitimas" type="number" min="1" value={formData.quantidade_vitimas} onChange={handleChange} />
          </FormGroup>
          <ButtonContainer>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SaveButton type="submit">Enviar Novo Registro</SaveButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
}

export default RegistroObitoModal;
