// frontend/src/components/RegistroObitoModal.tsx

import { useState, useEffect, ReactElement } from 'react';
import styled from 'styled-components';
import {
  IDataApoio,
  IObitoRegistroPayload,
  ICidade,
  IObitoRegistro, // Importa o tipo do registro completo
  deletarObitoRegistro // Importa a função de exclusão da API
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { device } from '../styles/theme';

// --- Styled Components ---
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
`;

const ModalContent = styled.div`
  background-color: #2c2c2c;
  padding: 2rem;
  border-radius: 8px;
  width: 450px;
  max-width: 100%;
  color: white;
  box-sizing: border-box;

  @media ${device.tablet} {
    width: 95%;
    padding: 1.5rem;
  }
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  font-size: 1.5rem;

  @media ${device.mobileL} {
    font-size: 1.2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label``;

const Input = styled.input`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
`;

const SaveButton = styled(Button)`
  background-color: #3a7ca5;
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: #555;
  color: white;
`;

// NOVO: Botão de Excluir estilizado
const DeleteButton = styled(Button)`
  background-color: #e76f51;
  color: white;
  margin-right: auto; // Alinha o botão à esquerda, empurrando os outros para a direita
`;


// --- Props Interface Atualizada ---
interface RegistroObitoModalProps {
  dataOcorrencia: string;
  naturezas: IDataApoio[];
  cidades: ICidade[];
  onClose: () => void;
  // A função onSave agora pode receber um ID opcional
  onSave: (formData: IObitoRegistroPayload, id?: number) => void;
  // Prop opcional para passar o registro a ser editado
  registroParaEditar?: IObitoRegistro | null;
}

// --- Componente Principal Atualizado ---
function RegistroObitoModal({ 
  dataOcorrencia, 
  naturezas, 
  cidades, 
  onClose, 
  onSave,
  registroParaEditar 
}: RegistroObitoModalProps): ReactElement {
  
  const isEditing = !!registroParaEditar;
  const { addNotification } = useNotification();

  // Função que define o estado inicial do formulário
  const getInitialFormData = (): IObitoRegistroPayload => {
    // Se estiver editando, preenche com os dados do registro
    if (isEditing && registroParaEditar) {
      return {
        data_ocorrencia: registroParaEditar.data_ocorrencia.split('T')[0],
        natureza_id: registroParaEditar.natureza_id,
        numero_ocorrencia: registroParaEditar.numero_ocorrencia || '',
        // Usa o cidade_id que buscamos da API
        obm_responsavel: registroParaEditar.cidade_id?.toString() || '',
        quantidade_vitimas: registroParaEditar.quantidade_vitimas,
      };
    }
    // Se for criação, retorna o formulário vazio
    return {
      data_ocorrencia: dataOcorrencia,
      natureza_id: 0, 
      numero_ocorrencia: '',
      obm_responsavel: '', 
      quantidade_vitimas: 1,
    };
  };

  const [formData, setFormData] = useState<IObitoRegistroPayload>(getInitialFormData());

  // Efeito para resetar o formulário se a prop de edição mudar
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [registroParaEditar, dataOcorrencia]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = (name === 'natureza_id' || name === 'quantidade_vitimas') 
      ? parseInt(value, 10) 
      : value;
    setFormData(prev => ({ ...prev, [name]: finalValue as any }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.natureza_id === 0) {
      addNotification('Por favor, selecione uma natureza.', 'error');
      return;
    }
    if (!formData.obm_responsavel) {
      addNotification('Por favor, selecione uma OBM Responsável.', 'error');
      return;
    }
    // Chama onSave passando o ID se estiver editando
    onSave(formData, registroParaEditar?.id);
  };

  // NOVO: Handler para o botão de exclusão
  const handleDelete = async () => {
    if (!registroParaEditar) return;

    if (window.confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
      try {
        await deletarObitoRegistro(registroParaEditar.id);
        addNotification('Registro excluído com sucesso!', 'success');
        onClose(); // Fecha o modal e aciona a recarga de dados na página principal
      } catch (error) {
        addNotification('Falha ao excluir o registro.', 'error');
      }
    }
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>{isEditing ? 'Editar Registro de Óbito' : 'Adicionar Registro de Óbito'}</ModalTitle>
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
            <Select 
              id="obm_responsavel" 
              name="obm_responsavel" 
              value={formData.obm_responsavel} 
              onChange={handleChange}
              required
            >
              <option value="" disabled>Selecione uma OBM</option>
              {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="quantidade_vitimas">Quantidade de Vítimas</Label>
            <Input id="quantidade_vitimas" name="quantidade_vitimas" type="number" min="1" value={formData.quantidade_vitimas} onChange={handleChange} />
          </FormGroup>

          <ButtonContainer>
            {/* Botão de excluir só aparece no modo de edição */}
            {isEditing && (
              <DeleteButton type="button" onClick={handleDelete}>Excluir</DeleteButton>
            )}
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SaveButton type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar Registro'}</SaveButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
}

export default RegistroObitoModal;
