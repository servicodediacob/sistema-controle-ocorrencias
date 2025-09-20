// Salve este código como: frontend/src/components/LancamentoModal.tsx

import React, { useState, useEffect, ReactElement } from 'react';
import styled from 'styled-components';
import { ICidade, IDataApoio, IOcorrencia } from '../services/api';
import { device } from '../styles/theme';

// --- Styled Components ---
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: #2c2c2c;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);

  @media ${device.tablet} {
    padding: 1.5rem;
  }
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  font-size: 1.5rem;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #aaa;
`;

const Input = styled.input`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled(Input).attrs({ as: 'select' })``;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
`;

const SaveButton = styled(Button)`
  background-color: #2a9d8f;
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: #555;
  color: white;
`;

// --- Interfaces ---
export interface LancamentoFormData {
  data_ocorrencia: string;
  cidade_id: number | '';
  natureza_id: number | '';
  quantidade: number;
}

interface LancamentoModalProps {
  itemParaEditar?: IOcorrencia | null;
  cidades: ICidade[];
  naturezas: IDataApoio[];
  onClose: () => void;
  onSave: (formData: LancamentoFormData, id?: number) => void;
}

// --- Componente ---
function LancamentoModal({
  itemParaEditar,
  cidades,
  naturezas,
  onClose,
  onSave,
}: LancamentoModalProps): ReactElement {
  const isEditing = !!itemParaEditar;

  const getInitialState = (): LancamentoFormData => {
    if (isEditing && itemParaEditar) {
      return {
        data_ocorrencia: itemParaEditar.data_ocorrencia.split('T')[0],
        cidade_id: itemParaEditar.cidade_id,
        natureza_id: itemParaEditar.natureza_id,
        quantidade: 1, // Em modo de edição, sempre editamos uma ocorrência por vez
      };
    }
    // Estado inicial para um novo lançamento
    return {
      data_ocorrencia: new Date().toISOString().split('T')[0],
      cidade_id: '',
      natureza_id: '',
      quantidade: 1,
    };
  };

  const [formData, setFormData] = useState<LancamentoFormData>(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  }, [itemParaEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = ['cidade_id', 'natureza_id', 'quantidade'].includes(name)
      ? parseInt(value, 10)
      : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cidade_id || !formData.natureza_id) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSave(formData, itemParaEditar?.id);
  };

  const naturezasAgrupadas = naturezas.reduce((acc, nat) => {
    const grupo = nat.grupo || 'Outros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(nat);
    return acc;
  }, {} as { [key: string]: IDataApoio[] });

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>{isEditing ? 'Editar Lançamento' : 'Novo Lançamento de Ocorrência'}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="data_ocorrencia">Data da Ocorrência</Label>
            <Input
              id="data_ocorrencia"
              name="data_ocorrencia"
              type="date"
              value={formData.data_ocorrencia}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="cidade_id">OBM (Cidade)</Label>
            <Select
              id="cidade_id"
              name="cidade_id"
              value={formData.cidade_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Selecione uma OBM</option>
              {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="natureza_id">Natureza da Ocorrência</Label>
            <Select
              id="natureza_id"
              name="natureza_id"
              value={formData.natureza_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Selecione uma natureza</option>
              {Object.entries(naturezasAgrupadas).map(([grupo, nats]) => (
                <optgroup label={grupo} key={grupo}>
                  {nats.map(nat => (
                    <option key={nat.id} value={nat.id}>{nat.subgrupo}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </FormGroup>

          {!isEditing && (
            <FormGroup>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={handleChange}
                required
              />
            </FormGroup>
          )}

          <ButtonContainer>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SaveButton type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar'}</SaveButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
}

export default LancamentoModal;
