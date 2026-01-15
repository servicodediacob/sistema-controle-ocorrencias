// frontend/src/pages/GestaoUsuariosPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
// CORREÇÃO: A interface IUser agora é importada do AuthProvider
import { getUsuarios, criarUsuario, updateUsuario, deleteUsuario, getCidades, ICidade, IUser } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import UsuarioModal from '../components/UsuarioModal';
import Spinner from '../components/Spinner';

const UsuarioCard: React.FC<{ usuario: IUser; onEdit: () => void; onDelete: () => void; }> = ({ usuario, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-text">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-bold text-text-strong">{usuario.nome}</p>
          <p className="text-sm">{usuario.email}</p>
          <p className="text-sm text-gray-400">OBM: {usuario.obm_nome || 'Sem OBM'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${usuario.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-200'}`}>
          {usuario.role}
        </span>
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-4">
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
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<IUser | null>(null);
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, cidadesData] = await Promise.all([
        getUsuarios(),
        getCidades()
      ]);
      setUsuarios(usersData);
      setCidades(cidadesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar dados.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar usuário.';
      addNotification(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteUsuario(id);
        addNotification('Usuário excluído com sucesso!', 'success');
        fetchData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao excluir usuário.';
        addNotification(message, 'error');
      }
    }
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-text-strong mb-8">Gestão de Usuários</h1>
      
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
        <div className="bg-surface border border-border rounded-lg p-0 md:border-none md:bg-transparent">
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">OBM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {usuarios.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-text-strong">{user.id}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text-strong">{user.nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{user.obm_nome || 'N/A'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text">{user.role}</td>
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
        </div>
      )}

      {isModalOpen && (
        <UsuarioModal
          usuario={usuarioEmEdicao}
          cidades={cidades}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </MainLayout>
  );
}

export default GestaoUsuariosPage;
