// Caminho: frontend/src/components/RegistroObitoModal.tsx

import { useState, useEffect, ReactElement } from 'react';
// Não precisamos mais de 'styled-components' ou 'device'
import {
  IDataApoio,
  IObitoRegistroPayload,
  ICidade,
  IObitoRegistro,
  deletarObitoRegistro
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// --- Props Interface (sem alterações) ---
interface RegistroObitoModalProps {
  dataOcorrencia: string;
  naturezas: IDataApoio[];
  cidades: ICidade[];
  onClose: () => void;
  onSave: (formData: IObitoRegistroPayload, id?: number) => void;
  registroParaEditar?: IObitoRegistro | null;
}

// --- Componente Principal ---
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

  // --- Lógica do Componente (sem alterações) ---
  const getInitialFormData = (): IObitoRegistroPayload => {
    if (isEditing && registroParaEditar) {
      return {
        data_ocorrencia: registroParaEditar.data_ocorrencia.split('T')[0],
        natureza_id: registroParaEditar.natureza_id,
        numero_ocorrencia: registroParaEditar.numero_ocorrencia || '',
        obm_responsavel: registroParaEditar.cidade_id?.toString() || '',
        quantidade_vitimas: registroParaEditar.quantidade_vitimas,
      };
    }
    return {
      data_ocorrencia: dataOcorrencia,
      natureza_id: 0,
      numero_ocorrencia: '',
      obm_responsavel: '',
      quantidade_vitimas: 1,
    };
  };

  const [formData, setFormData] = useState<IObitoRegistroPayload>(getInitialFormData());

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [registroParaEditar, dataOcorrencia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = (name === 'natureza_id' || name === 'quantidade_vitimas' || name === 'obm_responsavel')
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
    onSave(formData, registroParaEditar?.id);
  };

  const handleDelete = async () => {
    if (!registroParaEditar) return;

    if (window.confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
      try {
        await deletarObitoRegistro(registroParaEditar.id);
        addNotification('Registro excluído com sucesso!', 'success');
        onClose();
      } catch (error) {
        addNotification('Falha ao excluir o registro.', 'error');
      }
    }
  };

  // --- JSX Refatorado com Tailwind CSS ---
  return (
    // ModalBackdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
      onClick={onClose}
    >
      {/* ModalContent */}
      <div
        className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-2xl md:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* ModalTitle */}
        <h2 className="mb-6 text-xl font-semibold md:text-2xl">
          {isEditing ? 'Editar Registro de Óbito' : 'Adicionar Registro de Óbito'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* FormGroup */}
          <div className="flex flex-col gap-2">
            <label htmlFor="natureza_id" className="text-sm text-gray-400">Natureza</label>
            <select
              id="natureza_id"
              name="natureza_id"
              value={formData.natureza_id}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0} disabled>Selecione uma natureza</option>
              {naturezas.map(n => <option key={n.id} value={n.id}>{n.subgrupo}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="numero_ocorrencia" className="text-sm text-gray-400">Número da Ocorrência (RAI)</label>
            <input
              id="numero_ocorrencia"
              name="numero_ocorrencia"
              value={formData.numero_ocorrencia}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="obm_responsavel" className="text-sm text-gray-400">OBM Responsável</label>
            <select
              id="obm_responsavel"
              name="obm_responsavel"
              value={formData.obm_responsavel}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione uma OBM</option>
              {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="quantidade_vitimas" className="text-sm text-gray-400">Quantidade de Vítimas</label>
            <input
              id="quantidade_vitimas"
              name="quantidade_vitimas"
              type="number"
              min="1"
              value={formData.quantidade_vitimas}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ButtonContainer */}
          <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 sm:mr-auto"
              >
                Excluir
              </button>
            )}
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600"
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Registro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistroObitoModal;
