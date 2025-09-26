// Caminho: frontend/src/components/OcorrenciaDetalhadaModal.tsx

import React, { useState, useMemo } from 'react';
// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Importar do novo serviço dedicado
import { IOcorrenciaDetalhadaPayload } from '../services/ocorrenciaDetalhadaService';
// ======================= FIM DA CORREÇÃO =======================
import { useData } from '../contexts/DataProvider';
import { useNotification } from '../contexts/NotificationContext';
import Icon from './Icon';

interface OcorrenciaDetalhadaModalProps {
  onClose: () => void;
  onSave: (payload: IOcorrenciaDetalhadaPayload) => void;
}

const OcorrenciaDetalhadaModal: React.FC<OcorrenciaDetalhadaModalProps> = ({ onClose, onSave }) => {
  const { cidades, naturezas } = useData();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<Partial<IOcorrenciaDetalhadaPayload>>({
    data_ocorrencia: new Date().toISOString().split('T')[0],
    horario_ocorrencia: new Date().toTimeString().substring(0, 5),
  });
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('');

  const naturezasFiltradas = useMemo(() => {
    if (!grupoSelecionado) return [];
    return naturezas.filter(n => n.grupo === grupoSelecionado);
  }, [grupoSelecionado, naturezas]);

  const gruposUnicos = useMemo(() => [...new Set(naturezas.map(n => n.grupo))], [naturezas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // ======================= INÍCIO DA CORREÇÃO =======================
    // 2. Tipar o parâmetro 'prev' explicitamente
    setFormData((prev: Partial<IOcorrenciaDetalhadaPayload>) => ({ ...prev, [name]: value }));
    // ======================= FIM DA CORREÇÃO =======================
  };

  const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGrupoSelecionado(e.target.value);
    // ======================= INÍCIO DA CORREÇÃO =======================
    // 3. Tipar o parâmetro 'prev' explicitamente
    setFormData((prev: Partial<IOcorrenciaDetalhadaPayload>) => ({ ...prev, natureza_id: undefined }));
    // ======================= FIM DA CORREÇÃO =======================
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.natureza_id || !formData.cidade_id || !formData.resumo_ocorrencia) {
      addNotification('Preencha os campos obrigatórios: Natureza, Cidade e Resumo.', 'error');
      return;
    }
    onSave(formData as IOcorrenciaDetalhadaPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div 
        className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col rounded-lg bg-surface text-text shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold text-text-strong">Lançar Ocorrência Detalhada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} id="detailed-occurrence-form" className="flex-grow space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="numero_ocorrencia" className="block text-sm font-medium text-text">Nº Ocorrência (RAI)</label>
              <input type="text" name="numero_ocorrencia" id="numero_ocorrencia" onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
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
              <input type="text" name="endereco" id="endereco" onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="bairro" className="block text-sm font-medium text-text">Bairro</label>
              <input type="text" name="bairro" id="bairro" onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
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
              <input type="text" name="viaturas" id="viaturas" onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
            <div>
              <label htmlFor="veiculos_envolvidos" className="block text-sm font-medium text-text">Veículo(s) Envolvido(s)</label>
              <input type="text" name="veiculos_envolvidos" id="veiculos_envolvidos" onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong" />
            </div>
          </div>
          <div>
            <label htmlFor="dados_vitimas" className="block text-sm font-medium text-text">Dados da(s) Vítima(s)</label>
            <textarea id="dados_vitimas" name="dados_vitimas" rows={3} onChange={handleChange} className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong"></textarea>
          </div>
          <div>
            <label htmlFor="resumo_ocorrencia" className="block text-sm font-medium text-text">Resumo da Ocorrência *</label>
            <textarea id="resumo_ocorrencia" name="resumo_ocorrencia" rows={5} onChange={handleChange} required className="mt-1 block w-full rounded-md border-border bg-background p-2.5 text-text-strong"></textarea>
          </div>
        </form>
        <div className="flex flex-shrink-0 items-center justify-end gap-4 border-t border-border p-4">
          <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500">
            Cancelar
          </button>
          <button type="submit" form="detailed-occurrence-form" className="rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600">
            Salvar Ocorrência
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcorrenciaDetalhadaModal;
