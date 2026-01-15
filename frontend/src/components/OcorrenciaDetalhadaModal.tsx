// Caminho: frontend/src/components/OcorrenciaDetalhadaModal.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { IOcorrenciaDetalhada, IOcorrenciaDetalhadaPayload } from '../services/ocorrenciaDetalhadaService';
import { useData } from '../contexts/DataProvider';
import { useNotification } from '../contexts/NotificationContext';
import Icon from './Icon';

interface OcorrenciaDetalhadaModalProps {
  onClose: () => void;
  onSave: (payload: IOcorrenciaDetalhadaPayload, id?: number) => void;
  ocorrenciaParaEditar?: IOcorrenciaDetalhada | null; // Prop para edição
}

const OcorrenciaDetalhadaModal: React.FC<OcorrenciaDetalhadaModalProps> = ({ onClose, onSave, ocorrenciaParaEditar }) => {
  const { cidades, naturezas } = useData();
  const { addNotification } = useNotification();
  const isEditing = !!ocorrenciaParaEditar;

  // Função para definir o estado inicial do formulário
  const getInitialFormData = () => {
    if (isEditing && ocorrenciaParaEditar) {
      // Encontra o objeto completo da natureza para obter o nome do grupo
      const naturezaInicial = naturezas.find(n => n.id === ocorrenciaParaEditar.natureza_id);
      return {
        ...ocorrenciaParaEditar,
        data_ocorrencia: new Date(ocorrenciaParaEditar.data_ocorrencia).toISOString().split('T')[0],
        horario_ocorrencia: ocorrenciaParaEditar.horario_ocorrencia?.substring(0, 5) || '',
        // Define o grupo da natureza para preencher o primeiro select
        grupo_natureza: naturezaInicial?.grupo || '',
      };
    }
    // Estado inicial para uma nova ocorrência
    return {
      data_ocorrencia: new Date().toISOString().split('T')[0],
      horario_ocorrencia: new Date().toTimeString().substring(0, 5),
      grupo_natureza: '',
    };
  };

  const [formData, setFormData] = useState<Partial<IOcorrenciaDetalhadaPayload & { grupo_natureza: string }>>(getInitialFormData());
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>(formData.grupo_natureza || '');

  // Efeito para resetar o formulário quando o item de edição muda
  useEffect(() => {
    const initialState = getInitialFormData();
    setFormData(initialState);
    setGrupoSelecionado(initialState.grupo_natureza);
  }, [ocorrenciaParaEditar, isEditing, naturezas]);

  const naturezasFiltradas = useMemo(() => {
    if (!grupoSelecionado) return [];
    return naturezas.filter(n => n.grupo === grupoSelecionado);
  }, [grupoSelecionado, naturezas]);

  const gruposUnicos = useMemo(() => [...new Set(naturezas.map(n => n.grupo))], [naturezas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoGrupo = e.target.value;
    setGrupoSelecionado(novoGrupo);
    // Limpa a natureza selecionada ao trocar de grupo
    setFormData(prev => ({ ...prev, grupo_natureza: novoGrupo, natureza_id: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.natureza_id || !formData.cidade_id || !formData.resumo_ocorrencia) {
      addNotification('Preencha os campos obrigatórios: Natureza, Cidade e Resumo.', 'error');
      return;
    }
    onSave(formData as IOcorrenciaDetalhadaPayload, ocorrenciaParaEditar?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div 
        className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col rounded-lg bg-surface text-text shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold text-text-strong">
            {isEditing ? 'Editar Ocorrência Detalhada' : 'Lançar Ocorrência Detalhada'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} id="detailed-occurrence-form" className="flex-grow space-y-6 overflow-y-auto p-6">
          {/* Campos do formulário (sem alteração na estrutura JSX) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="numero_ocorrencia" className="block text-sm font-medium text-text">Nº Ocorrência (RAI)</label>
              <input type="text" name="numero_ocorrencia" id="numero_ocorrencia" value={formData.numero_ocorrencia || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="horario_ocorrencia" className="block text-sm font-medium text-text">Horário</label>
              <input type="time" name="horario_ocorrencia" id="horario_ocorrencia" value={formData.horario_ocorrencia || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="data_ocorrencia" className="block text-sm font-medium text-text">Data *</label>
              <input type="date" name="data_ocorrencia" id="data_ocorrencia" value={formData.data_ocorrencia || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="grupo_natureza" className="block text-sm font-medium text-text">Grupo da Natureza *</label>
              <select id="grupo_natureza" name="grupo_natureza" value={grupoSelecionado} onChange={handleGrupoChange} required className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong">
                <option value="">Selecione um grupo</option>
                {gruposUnicos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="natureza_id" className="block text-sm font-medium text-text">Natureza *</label>
              <select id="natureza_id" name="natureza_id" value={formData.natureza_id || ''} onChange={handleChange} required disabled={!grupoSelecionado} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong disabled:opacity-50">
                <option value="">Selecione uma natureza</option>
                {naturezasFiltradas.map(n => <option key={n.id} value={n.id}>{n.subgrupo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <label htmlFor="endereco" className="block text-sm font-medium text-text">Endereço</label>
              <input type="text" name="endereco" id="endereco" value={formData.endereco || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="bairro" className="block text-sm font-medium text-text">Bairro</label>
              <input type="text" name="bairro" id="bairro" value={formData.bairro || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
          </div>
          <div>
              <label htmlFor="cidade_id" className="block text-sm font-medium text-text">Cidade (OBM) *</label>
              <select id="cidade_id" name="cidade_id" value={formData.cidade_id || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong">
                <option value="">Selecione uma cidade</option>
                {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
              </select>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="viaturas" className="block text-sm font-medium text-text">Viatura(s)</label>
              <input type="text" name="viaturas" id="viaturas" value={formData.viaturas || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="veiculos_envolvidos" className="block text-sm font-medium text-text">Veículo(s) Envolvido(s)</label>
              <input type="text" name="veiculos_envolvidos" id="veiculos_envolvidos" value={formData.veiculos_envolvidos || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
          </div>
          <div>
            <label htmlFor="dados_vitimas" className="block text-sm font-medium text-text">Dados da(s) Vítima(s)</label>
            <textarea id="dados_vitimas" name="dados_vitimas" rows={3} value={formData.dados_vitimas || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong"></textarea>
          </div>
          <div>
            <label htmlFor="resumo_ocorrencia" className="block text-sm font-medium text-text">Resumo da Ocorrência *</label>
            <textarea id="resumo_ocorrencia" name="resumo_ocorrencia" rows={5} value={formData.resumo_ocorrencia || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong"></textarea>
          </div>
        </form>
        <div className="flex flex-shrink-0 items-center justify-end gap-4 border-t border-border p-4">
          <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500">
            Cancelar
          </button>
          <button type="submit" form="detailed-occurrence-form" className="rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600">
            {isEditing ? 'Salvar Alterações' : 'Salvar Ocorrência'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcorrenciaDetalhadaModal;
