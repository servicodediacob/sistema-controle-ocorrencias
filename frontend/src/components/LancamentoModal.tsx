// Caminho: frontend/src/components/LancamentoModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ICidade, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/useAuth';
import SearchableSelect from './SearchableSelect'; // 1. Importe o novo componente

function LancamentoModal({ cidades, naturezas, onClose, onSave, itemParaEditar }: any) {
  const { addNotification } = useNotification();
  const { usuario } = useAuth();
  const isEditing = !!itemParaEditar;

  const getInitialQuantidades = () => {
    if (isEditing && itemParaEditar) {
      const quantidadesIniciais: Record<string, string> = {};
      for (const subgrupo in itemParaEditar.dados) {
        const natureza = naturezas.find((n: IDataApoio) => n.subgrupo === subgrupo);
        if (natureza) {
          quantidadesIniciais[natureza.id] = itemParaEditar.dados[subgrupo].toString();
        }
      }
      return quantidadesIniciais;
    }
    return {};
  };

  const [dataOcorrencia, setDataOcorrencia] = useState(new Date().toISOString().split('T')[0]);
  const [cidadeId, setCidadeId] = useState<number | ''>(isEditing ? itemParaEditar.cidade.id : '');
  const [quantidades, setQuantidades] = useState<Record<string, string>>(getInitialQuantidades());

  const totalOcorrencias = useMemo(() => {
    return Object.values(quantidades).reduce((acc, valor) => {
      const num = parseInt(valor, 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [quantidades]);

  useEffect(() => {
    if (usuario?.role === 'user' && usuario.obm_id) {
      setCidadeId(usuario.obm_id);
    } else {
      setCidadeId(isEditing ? itemParaEditar.cidade.id : '');
    }
    setQuantidades(getInitialQuantidades());
  }, [itemParaEditar, usuario]);

  const handleQuantidadeChange = (naturezaId: number, valor: string) => {
    const valorLimpo = valor.replace(/[^0-9]/g, '');
    setQuantidades(prev => ({ ...prev, [naturezaId]: valorLimpo }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidadeId) {
      addNotification('Por favor, selecione uma OBM (Cidade).', 'error');
      return;
    }
    onSave({ data_ocorrencia: dataOcorrencia, cidade_id: cidadeId, quantidades });
  };

  const limparFormulario = () => {
    setQuantidades({});
    addNotification('Campos de quantidade foram limpos.', 'info');
  };

  const naturezasAgrupadas = naturezas.reduce((acc: any, nat: IDataApoio) => {
    const grupo = nat.grupo || 'Outros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(nat);
    return acc;
  }, {} as { [key: string]: IDataApoio[] });

  // ======================= INÍCIO DA CORREÇÃO =======================

  // 2. Prepara os dados para o SearchableSelect
  const obmsParaSelecao = useMemo(() =>
    cidades.map((c: ICidade) => ({ id: c.id, nome: c.cidade_nome })),
    [cidades]
  );

  // ======================= FIM DA CORREÇÃO =======================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-gray-800 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-700 p-6">
            <h2 className="text-xl font-semibold">
            {isEditing ? `Editando Lançamentos de ${itemParaEditar.cidade.cidade_nome}` : 'Formulário de Lançamento de Ocorrências'}
            </h2>
            <div className="text-right">
                <span className="text-sm text-gray-400">Total Lançado</span>
                <p className="text-2xl font-bold text-teal-400">{totalOcorrencias}</p>
            </div>
        </div>
        <form id="lancamento-form" onSubmit={handleSubmit} className="flex flex-grow flex-col gap-6 overflow-y-auto p-6">
          <div className="flex flex-wrap items-end gap-4">
            
            {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
            
            {/* 3. Substitui o <select> pelo novo componente */}
            <div className="flex min-w-[250px] flex-1 flex-col gap-2">
              <label htmlFor="cidade_id" className="text-sm text-gray-400">OBM (Obrigatório)</label>
              <SearchableSelect
                items={obmsParaSelecao}
                selectedId={cidadeId}
                onSelect={(id) => setCidadeId(id)}
                placeholder="Digite para buscar uma OBM"
                disabled={isEditing || usuario?.role === 'user'}
              />
            </div>

            {/* ======================= FIM DA CORREÇÃO ======================= */}

            <div className="flex min-w-[250px] flex-1 flex-col gap-2">
              <label htmlFor="data_ocorrencia" className="text-sm text-gray-400">Data da Ocorrência</label>
              <input
                id="data_ocorrencia" name="data_ocorrencia" type="date"
                value={dataOcorrencia} onChange={e => setDataOcorrencia(e.target.value)} required
                className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {Object.entries(naturezasAgrupadas).map(([grupo, nats]) => (
            <fieldset key={grupo} className="rounded-lg border border-gray-700 p-6">
              <legend className="px-2 text-lg font-bold text-yellow-400">{grupo}</legend>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 pt-2">
                {(nats as IDataApoio[]).map((nat: IDataApoio) => (
                  <div key={nat.id} className="flex flex-col gap-2">
                    <label htmlFor={`nat-${nat.id}`} className="text-sm text-gray-400">{nat.subgrupo}</label>
                    <input
                      id={`nat-${nat.id}`} type="number" min="0" placeholder="0"
                      value={quantidades[nat.id] || ''}
                      onChange={e => handleQuantidadeChange(nat.id, e.target.value)}
                      className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </form>
        <div className="flex flex-shrink-0 items-center justify-end gap-4 border-t border-gray-700 p-6">
          <button type="button" onClick={limparFormulario} className="mr-auto rounded-md bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700">
            Limpar Formulário
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-500">
            Cancelar
          </button>
          <button type="submit" form="lancamento-form" className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700">
            {isEditing ? 'Salvar Alterações' : 'Enviar Dados'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LancamentoModal;
