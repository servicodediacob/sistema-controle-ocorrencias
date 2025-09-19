// src/pages/GestaoUsuariosPage.tsx

import React, { useState, useEffect, ReactElement, CSSProperties } from 'react';
import { getUsuarios, criarUsuario, updateUsuario, deleteUsuario, IUser } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// 1. Importar o layout principal
import MainLayout from '../components/MainLayout';

// --- Componente do Modal (sem alterações) ---
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

  const styles: { [key: string]: CSSProperties } = {
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#2c2c2c', padding: '2rem', borderRadius: '8px', width: '400px', color: 'white' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#3a3a3a', color: 'white' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="nome" style={styles.label}>Nome</label>
            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required style={styles.input} />
          </div>
          {!isEditing && (
            <div style={styles.formGroup}>
              <label htmlFor="senha" style={styles.label}>Senha</label>
              <input type="password" id="senha" name="senha" value={formData.senha} onChange={handleChange} required style={styles.input} />
            </div>
          )}
          <div style={styles.buttonContainer}>
            <button type="button" onClick={onClose} style={{...styles.button, backgroundColor: '#555'}}>Cancelar</button>
            <button type="submit" style={{...styles.button, backgroundColor: '#3a7ca5'}}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Componente Principal da Página ---
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

  const styles: { [key: string]: CSSProperties } = {
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    actionButtons: { display: 'flex', gap: '0.5rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  return (
    // 2. Envolver o conteúdo com MainLayout
    <MainLayout pageTitle="Gestão de Usuários">
      <button onClick={() => handleOpenModal()} style={{...styles.button, backgroundColor: '#2a9d8f', marginBottom: '1rem'}}>
        Adicionar Usuário
      </button>
      
      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
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
