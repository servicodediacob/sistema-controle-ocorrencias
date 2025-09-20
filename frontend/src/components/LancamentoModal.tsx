// Caminho: frontend/src/components/LancamentoModal.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ICidade, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// --- Styled Components (sem alterações) ---
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: center; z-index: 1000; padding: 1rem;
`;
const ModalContent = styled.div`
  background-color: #2c2c2c; padding: 2rem; border-radius: 8px;
  width: 100%; max-width: 900px; max-height: 90vh;
  display: flex; flex-direction: column; color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;
const ModalTitle = styled.h2`
  margin-top: 0; font-size: 1.5rem; border-bottom: 1px solid #444;
  padding-bottom: 1rem; margin-bottom: 1.5rem; flex-shrink: 0;
`;
const Form = styled.form`
  display: flex; flex-direction: column; gap: 1.5rem;
  overflow-y: auto; padding-right: 1rem;
`;
const TopControls = styled.div`
  display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 250px;
`;
const Label = styled.label`
  font-size: 0.9rem; color: #aaa;
`;
const Input = styled.input`
  padding: 0.75rem; background-color: #3a3a3a; border: 1px solid #555;
  color: white; border-radius: 4px; font-size: 1rem;
`;
const Select = styled(Input).attrs({ as: 'select' })``;
const Fieldset = styled.fieldset`
  border: 1px solid #444; border-radius: 8px; padding: 1.5rem; margin: 0;
`;
const Legend = styled.legend`
  padding: 0 0.5rem; font-weight: bold; font-size: 1.2rem; color: #e9c46a;
`;
const FormGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;
`;
const ButtonContainer = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; flex-shrink: 0;
`;
const Button = styled.button`
  padding: 0.75rem 1.5rem; border: none; border-radius: 4px;
  cursor: pointer; font-size: 1rem; font-weight: 600;
`;
const SaveButton = styled(Button)`
  background-color: #2a9d8f; color: white;
`;
const CancelButton = styled(Button)`
  background-color: #555; color: white;
`;
const ClearButton = styled(Button)`
  background-color: #e76f51; color: white; margin-right: auto;
`;

// --- Interfaces ---
interface LancamentoModalProps {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  onClose: () => void;
  onSave: (formData: any) => void;
  itemParaEditar: { cidade: ICidade; dados: Record<string, number> } | null;
}

function LancamentoModal({ cidades, naturezas, onClose, onSave, itemParaEditar }: LancamentoModalProps) {
  const { addNotification } = useNotification();
  const isEditing = !!itemParaEditar;

  const getInitialQuantidades = () => {
    if (isEditing && itemParaEditar) {
      // Mapeia os dados recebidos para o formato { natureza_id: quantidade }
      const quantidadesIniciais: Record<string, string> = {};
      for (const subgrupo in itemParaEditar.dados) {
        const natureza = naturezas.find(n => n.subgrupo === subgrupo);
        if (natureza) {
          quantidadesIniciais[natureza.id] = itemParaEditar.dados[subgrupo].toString();
        }
      }
      return quantidadesIniciais;
    }
    return {};
  };

  const [dataOcorrencia, setDataOcorrencia] = useState(new Date().toISOString().split('T')[0]);
  const [cidadeId, setCidadeId] = useState<number | ''>(isEditing ? itemParaEditar.cidade.id : '');
  const [quantidades, setQuantidades] = useState<Record<string, string>>(getInitialQuantidades());

  useEffect(() => {
    // Se o item para editar mudar, reseta o formulário
    setCidadeId(isEditing ? itemParaEditar.cidade.id : '');
    setQuantidades(getInitialQuantidades());
  }, [itemParaEditar]);

  const handleQuantidadeChange = (naturezaId: number, valor: string) => {
    const valorLimpo = valor.replace(/[^0-9]/g, '');
    setQuantidades(prev => ({ ...prev, [naturezaId]: valorLimpo }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidadeId) {
      addNotification('Por favor, selecione uma OBM (Cidade).', 'error');
      return;
    }
    onSave({ data_ocorrencia: dataOcorrencia, cidade_id: cidadeId, quantidades });
  };

  const limparFormulario = () => {
    setQuantidades({});
    addNotification('Campos de quantidade foram limpos.', 'info');
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
        <ModalTitle>
          {isEditing ? `Editando Lançamentos de ${itemParaEditar.cidade.cidade_nome}` : 'Formulário de Lançamento de Ocorrências'}
        </ModalTitle>
        
        <Form id="lancamento-form" onSubmit={handleSubmit}>
          <TopControls>
            <FormGroup>
              <Label htmlFor="cidade_id">OBM (Obrigatório)</Label>
              <Select id="cidade_id" name="cidade_id" value={cidadeId} onChange={e => setCidadeId(Number(e.target.value))} required disabled={isEditing}>
                <option value="" disabled>Selecione uma OBM</option>
                {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="data_ocorrencia">Data da Ocorrência</Label>
              <Input id="data_ocorrencia" name="data_ocorrencia" type="date" value={dataOcorrencia} onChange={e => setDataOcorrencia(e.target.value)} required />
            </FormGroup>
          </TopControls>

          {Object.entries(naturezasAgrupadas).map(([grupo, nats]) => (
            <Fieldset key={grupo}>
              <Legend>{grupo}</Legend>
              <FormGrid>
                {nats.map(nat => (
                  <FormGroup key={nat.id}>
                    <Label htmlFor={`nat-${nat.id}`}>{nat.subgrupo}</Label>
                    <Input
                      id={`nat-${nat.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={quantidades[nat.id] || ''}
                      onChange={e => handleQuantidadeChange(nat.id, e.target.value)}
                    />
                  </FormGroup>
                ))}
              </FormGrid>
            </Fieldset>
          ))}
        </Form>

        <ButtonContainer>
          <ClearButton type="button" onClick={limparFormulario}>Limpar Formulário</ClearButton>
          <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
          <SaveButton type="submit" form="lancamento-form">
            {isEditing ? 'Salvar Alterações' : 'Enviar Dados'}
          </SaveButton>
        </ButtonContainer>
      </ModalContent>
    </ModalBackdrop>
  );
}

export default LancamentoModal;
