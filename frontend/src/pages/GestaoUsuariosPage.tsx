import { useState, useEffect, useCallback, ReactElement } from 'react';
import { getUsuarios, criarUsuario, updateUsuario, deleteUsuario, IUser } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import UsuarioModal from '../components/UsuarioModal'; // Importando o novo modal
import Spinner from '../components/Spinner';

// NOVO: Componente de Card para a lista de usuários
const UsuarioCard: React.FC<{ usuario: IUser; onEdit: () => void; onDelete: () => void; }> = ({ usuario, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-bold">{usuario.nome}</p>
          <p className="text-sm text-gray-400">{usuario.email}</p>
          <p className="mt-1 text-xs text-gray-500">ID: {usuario.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${usuario.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-200'}`}>
          {usuario.role}
        </span>
      </div>
      <div className="mt-4 flex gap-2 border-t border-gray-700 pt-4">
        <button onClick={onEdit} className="flex-1 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400">
          Editar
        </button>
        <button onClick={onDelete} className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
          Excluir
        </button>
      </div>
    </div>
  );
};

function GestaoUsuariosPage(): ReactElement {
  const [usuarios, setUsuarios] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<IUser | null>(null);
  const { addNotification } = useNotification();

  const fetchUsuarios = useCallback(async () => {
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
  }, [addNotification]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenModal = (usuario: IUser | null = null) => {
    setUsuarioEmEdicao(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUsuarioEmEdicao(null);
  };

  const handleSave = async (formData: Partial<IUser> & { senha?: string }) => {
    try {
      if (usuarioEmEdicao) {
        await updateUsuario(usuarioEmEdicao.id, formData);
        addNotification('Usuário atualizado com sucesso!', 'success');
      } else {
        await criarUsuario(formData as Omit<IUser, 'id'> & { senha?: string });
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
        <div className="flex justify-center p-10"><Spinner text="Carregando usuários..." /></div>
      ) : (
        <>
          {/* Tabela para Desktop */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-700 md:block">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {usuarios.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">{user.id}</td>
                    <td className="whitespace-nowrap px-6 py-4">{user.nome}</td>
                    <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4">{user.role}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(user)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                        <button onClick={() => handleDelete(user.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards para Mobile */}
          <div className="space-y-4 md:hidden">
            {usuarios.map(user => (
              <UsuarioCard
                key={user.id}
                usuario={user}
                onEdit={() => handleOpenModal(user)}
                onDelete={() => handleDelete(user.id)}
              />
            ))}
          </div>
        </>
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
