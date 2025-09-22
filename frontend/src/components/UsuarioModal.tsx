import { useState, ReactElement } from 'react';
import { IUser } from '../services/api';

// Interface para as props do modal
interface UsuarioModalProps {
  usuario: IUser | null;
  onClose: () => void;
  onSave: (formData: Partial<IUser> & { senha?: string }) => void;
}

function UsuarioModal({ usuario, onClose, onSave }: UsuarioModalProps): ReactElement {
  const [formData, setFormData] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    role: usuario?.role || 'user',
    obm_id: usuario?.obm_id || '',
    senha: '',
  });
  const isEditing = !!usuario;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing && !formData.senha) {
      alert('A senha é obrigatória para criar um novo usuário.');
      return;
    }
    // Prepara o payload para enviar, convertendo obm_id para número ou null
    const payload = {
      ...formData,
      obm_id: formData.obm_id ? Number(formData.obm_id) : null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold">
          {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo Nome */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-sm text-gray-400">Nome</label>
            <input
              type="text" id="nome" name="nome" value={formData.nome}
              onChange={handleChange} required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Campo Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-400">Email</label>
            <input
              type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Campo Senha (apenas para criação) */}
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <label htmlFor="senha" className="text-sm text-gray-400">Senha</label>
              <input
                type="password" id="senha" name="senha" value={formData.senha}
                onChange={handleChange} required
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {/* Botões de Ação */}
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

export default UsuarioModal;
