// frontend/src/components/UsuarioModal.tsx

import { useState, useEffect, ReactElement } from 'react';
import { IUser, ICidade } from '../services/api';

interface UsuarioModalProps {
  usuario: IUser | null;
  cidades: ICidade[];
  onClose: () => void;
  onSave: (formData: Partial<IUser> & { senha?: string }) => void | Promise<void>;
}

function UsuarioModal({ usuario, cidades, onClose, onSave }: UsuarioModalProps): ReactElement {
  const isEditing = !!usuario;

  // Função para obter o estado inicial do formulário
  const getInitialState = () => ({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    // --- INÍCIO DA CORREÇÃO ---
    // Garante que 'role' sempre tenha um valor padrão, mesmo para novos usuários.
    // Isso resolve o erro de tipo, pois o estado nunca será 'undefined'.
    role: usuario?.role || 'user',
    // --- FIM DA CORREÇÃO ---
    obm_id: usuario?.obm_id || '',
    senha: '',
  });

  const [formData, setFormData] = useState(getInitialState);

  // Sincroniza o estado do formulário se o usuário em edição mudar
  useEffect(() => {
    if (usuario) {
      setFormData(getInitialState());
    }
    // A dependência `getInitialState` não é necessária, pois a função é recriada a cada render.
    // As dependências corretas são `usuario`.
  }, [usuario]);

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
    const payload = {
      ...formData,
      obm_id: formData.obm_id ? Number(formData.obm_id) : null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface border border-border p-6 text-text shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold text-text-strong">
          {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo Nome */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-sm text-text">Nome</label>
            <input
              type="text" id="nome" name="nome" value={formData.nome}
              onChange={handleChange} required
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Campo Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-text">Email</label>
            <input
              type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} required
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Campo Role (Nível de Acesso) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-sm text-text">Nível de Acesso</label>
            <select
              id="role" name="role" value={formData.role}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuário Padrão</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Campo OBM */}
          <div className="flex flex-col gap-2">
            <label htmlFor="obm_id" className="text-sm text-text">OBM de Lotação</label>
            <select
              id="obm_id" name="obm_id" value={formData.obm_id}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma (Admin Geral)</option>
              {cidades.map(cidade => (
                <option key={cidade.id} value={cidade.id}>{cidade.cidade_nome}</option>
              ))}
            </select>
          </div>

          {/* Campo Senha (apenas para criação) */}
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <label htmlFor="senha" className="text-sm text-gray-400">Senha</label>
              <input
                type="password" id="senha" name="senha" value={formData.senha}
                onChange={handleChange} required
                className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-500 px-6 py-3 font-semibold text-white transition hover:bg-gray-600">
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
