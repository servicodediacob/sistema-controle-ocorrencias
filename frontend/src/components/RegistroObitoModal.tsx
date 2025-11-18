// Caminho: frontend/src/components/RegistroObitoModal.tsx

import { useState, useEffect, ReactElement } from 'react';
import {
  IDataApoio,
  IObitoRegistroPayload,
  ICidade,
  IObitoRegistro,
  deletarObitoRegistro
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface RegistroObitoModalProps {
  dataOcorrencia: string;
  naturezas: IDataApoio[];
  cidades: ICidade[];
  onClose: () => void;
  onSave: (formData: IObitoRegistroPayload, id?: number) => void;
  registroParaEditar?: IObitoRegistro | null;
}

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

  // A interface interna do formulário agora usa 'obm_id' para consistência.
  const getInitialFormData = () => {
    if (isEditing && registroParaEditar) {
      return {
        data_ocorrencia: registroParaEditar.data_ocorrencia.split('T')[0],
        natureza_id: registroParaEditar.natureza_id,
        numero_ocorrencia: registroParaEditar.numero_ocorrencia || '',
        obm_id: registroParaEditar.obm_id?.toString() || '', // Usa obm_id
        quantidade_vitimas: registroParaEditar.quantidade_vitimas,
      };
    }
    return {
      data_ocorrencia: dataOcorrencia,
      natureza_id: 0,
      numero_ocorrencia: '',
      obm_id: '', // Usa obm_id
      quantidade_vitimas: 1,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [registroParaEditar, dataOcorrencia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.natureza_id === 0) {
      addNotification('Por favor, selecione uma natureza.', 'error');
      return;
    }
    if (!formData.obm_id) {
      addNotification('Por favor, selecione uma OBM Responsável.', 'error');
      return;
    }

    // Monta o payload final com os tipos corretos para a API
    const payload: IObitoRegistroPayload = {
      ...formData,
      natureza_id: Number(formData.natureza_id),
      obm_id: Number(formData.obm_id), // Converte obm_id para número
      quantidade_vitimas: Number(formData.quantidade_vitimas),
    };
    
    onSave(payload, registroParaEditar?.id);
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

  const processedCidades = Array.from(cidades.reduce((map, cidade) => {
    if (cidade.cidade_nome.startsWith('GOIÂNIA')) {
      if (!map.has('GOIÂNIA')) {
        map.set('GOIÂNIA', { ...cidade, cidade_nome: 'GOIÂNIA' });
      }
    } else if (cidade.cidade_nome.startsWith('APARECIDA DE GOIÂNIA')) {
      if (!map.has('APARECIDA DE GOIÂNIA')) {
        map.set('APARECIDA DE GOIÂNIA', { ...cidade, cidade_nome: 'APARECIDA DE GOIÂNIA' });
      }
    } else {
      map.set(cidade.cidade_nome, cidade);
    }
    return map;
  }, new Map<string, ICidade>()).values());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-2xl md:p-8"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-semibold md:text-2xl">
          {isEditing ? 'Editar Registro de Óbito' : 'Adicionar Registro de Óbito'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {/* ======================= INÍCIO DA CORREÇÃO NO JSX ======================= */}
          <div className="flex flex-col gap-2">
            <label htmlFor="obm_id" className="text-sm text-gray-400">OBM Responsável</label>
            <select
              id="obm_id"
              name="obm_id" // O 'name' agora é 'obm_id'
              value={formData.obm_id} // O 'value' agora é 'obm_id'
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione uma OBM</option>
              {processedCidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
            </select>
          </div>
          {/* ======================= FIM DA CORREÇÃO NO JSX ======================= */}

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
