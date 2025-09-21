// Caminho: frontend/src/pages/GestaoUsuariosPage.tsx (CORRIGIDO)

import React, { useState, useEffect, ReactElement } from 'react';
import { getUsuarios, criarUsuario, updateUsuario, deleteUsuario, IUser } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';

// --- Componente do Modal de Usuário ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold">
          {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-sm text-gray-400">Nome</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-400">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <label htmlFor="senha" className="text-sm text-gray-400">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600">
              Salvar
            </button>
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

  return (
    <MainLayout pageTitle="Gestão de Usuários">
      <div className="mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
        >
          Adicionar Usuário
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
              {usuarios.map(user => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-6 py-4">{user.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">{user.nome}</td>
                  <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Excluir
                      </button>
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
