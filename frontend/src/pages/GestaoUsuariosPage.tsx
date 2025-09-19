import React, { useState, useEffect, ReactElement } from 'react';
import { getUsuarios, criarUsuario, updateUsuario, deleteUsuario, IUser } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import { device } from '../styles/theme'; // 1. Importe
import styled from 'styled-components'; // 1. Importe

// --- Componentes Estilizados para o Modal ---

const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.7); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
`;

const ModalContent = styled.div`
  background-color: #2c2c2c; padding: 2rem;
  border-radius: 8px; width: 400px; color: white;
  max-width: 100%;
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
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%; padding: 0.75rem; border-radius: 4px;
  border: 1px solid #555; background-color: #3a3a3a; color: white;
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem; border-radius: 4px; border: none; cursor: pointer;
`;

const SaveButton = styled(Button)`
  background-color: #3a7ca5;
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: #555;
  color: white;
`;


// --- Componente do Modal ---
interface UsuarioModalProps {
  usuario: IUser | null;
  onClose: () => void;
  onSave: (formData: Omit<IUser, 'id' | 'criado_em'> & { senha?: string }) => void;
}

function UsuarioModal({ usuario, onClose, onSave }: UsuarioModalProps): ReactElement {
  const [formData, setFormData] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: '',
  });
  const isEditing = !!usuario;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing && !formData.senha) {
      alert('A senha é obrigatória para criar um novo usuário.');
      return;
    }
    onSave(formData);
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="nome">Nome</Label>
            <Input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </FormGroup>
          {!isEditing && (
            <FormGroup>
              <Label htmlFor="senha">Senha</Label>
              <Input type="password" id="senha" name="senha" value={formData.senha} onChange={handleChange} required />
            </FormGroup>
          )}
          <ButtonContainer>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SaveButton type="submit">Salvar</SaveButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
}

// --- Componente Principal da Página (sem alterações na lógica) ---
// O restante do código permanece o mesmo.

function GestaoUsuariosPage(): ReactElement {
  const [usuarios, setUsuarios] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<IUser | null>(null);
  const { addNotification } = useNotification();

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar usuários.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenModal = (usuario: IUser | null = null) => {
    setUsuarioEmEdicao(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUsuarioEmEdicao(null);
  };

  const handleSave = async (formData: { nome: string; email: string; senha?: string }) => {
    try {
      if (usuarioEmEdicao) {
        await updateUsuario(usuarioEmEdicao.id, { nome: formData.nome, email: formData.email });
        addNotification('Usuário atualizado com sucesso!', 'success');
      } else {
        const payload = { nome: formData.nome, email: formData.email, senha: formData.senha };
        await criarUsuario(payload);
        addNotification('Usuário criado com sucesso!', 'success');
      }
      handleCloseModal();
      fetchUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar usuário.';
      addNotification(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteUsuario(id);
        addNotification('Usuário excluído com sucesso!', 'success');
        fetchUsuarios();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao excluir usuário.';
        addNotification(message, 'error');
      }
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '600px' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    actionButtons: { display: 'flex', gap: '0.5rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  return (
    <MainLayout pageTitle="Gestão de Usuários">
      <button onClick={() => handleOpenModal()} style={{...styles.button, backgroundColor: '#2a9d8f', marginBottom: '1rem'}}>
        Adicionar Usuário
      </button>
      
      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.nome}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button onClick={() => handleOpenModal(user)} style={{...styles.button, backgroundColor: '#e9c46a', color: 'black'}}>Editar</button>
                      <button onClick={() => handleDelete(user.id)} style={{...styles.button, backgroundColor: '#e76f51'}}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <UsuarioModal
          usuario={usuarioEmEdicao}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </MainLayout>
  );
}

export default GestaoUsuariosPage;
