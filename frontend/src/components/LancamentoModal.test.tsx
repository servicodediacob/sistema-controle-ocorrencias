// Caminho: frontend/src/components/LancamentoModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ICidade, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/useAuth';
import SearchableSelect from './SearchableSelect';

const ORDEM_GRUPOS = [
  'Resgate',
  'Incêndio',
  'Busca e Salvamento',
  'Ações Preventivas',
  'Atividades Técnicas',
  'Produtos Perigosos',
  'Defesa Civil',
];

interface LancamentoModalProps {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  onClose: () => void;
  onSave: (formData: any) => void;
  itemParaEditar: any | null;
  obmsComDados: Set<number>;
}

function LancamentoModal({
  cidades,
  naturezas,
  onClose,
  onSave,
  itemParaEditar,
  obmsComDados,
}: LancamentoModalProps) {
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
  
  const [cidadeId, setCidadeId] = useState<number | ''>(() => {
    if (isEditing) return itemParaEditar.cidade.id;
    if (usuario?.role === 'user' && usuario.obm_id) return usuario.obm_id;
    return '';
  });

  const [quantidades, setQuantidades] = useState<Record<string, string>>(getInitialQuantidades());

  const totalOcorrencias = useMemo(() => {
    return Object.values(quantidades).reduce((acc, valor) => {
      const num = parseInt(valor, 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [quantidades]);

  useEffect(() => {
    if (isEditing) {
      setCidadeId(itemParaEditar.cidade.id);
    } else if (usuario?.role === 'user' && usuario.obm_id) {
      setCidadeId(usuario.obm_id);
    } else {
      setCidadeId('');
    }
    setQuantidades(getInitialQuantidades());
  }, [itemParaEditar, usuario, isEditing]);

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

    const estatisticas = Object.entries(quantidades)
      .map(([natureza_id, quantidadeStr]) => ({
        natureza_id: Number(natureza_id),
        quantidade: Number(quantidadeStr) || 0,
      }))
      .filter(item => item.quantidade > 0);

    // ======================= INÍCIO DA CORREÇÃO =======================
    // Ajuste dos nomes das chaves para corresponder ao backend
    const payload = {
      data_registro: dataOcorrencia, // CORRIGIDO: de 'data_ocorrencia' para 'data_registro'
      obm_id: cidadeId,
      estatisticas: estatisticas,      // CORRIGIDO: de 'quantidades' para 'estatisticas'
    };
    // ======================= FIM DA CORREÇÃO =======================
    
    console.log('[DIAGNÓSTICO FRONTEND] Payload enviado para a API:', JSON.stringify(payload, null, 2));
    
    onSave(payload);
  };

  const limparFormulario = () => {
    setQuantidades({});
    addNotification('Campos de quantidade foram limpos.', 'info');
  };

  const naturezasAgrupadas = useMemo(() => 
    naturezas.reduce((acc: { [key: string]: IDataApoio[] }, nat: IDataApoio) => {
      const grupo = nat.grupo || 'Outros';
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(nat);
      return acc;
    }, {}),
    [naturezas]
  );

  const obmsParaSelecao = useMemo(() =>
    cidades.map((c: ICidade) => ({ id: c.id, nome: c.cidade_nome })),
    [cidades]
  );

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
            <div className="flex min-w-[250px] flex-1 flex-col gap-2">
              <label htmlFor="obm_id" className="text-sm text-gray-400">OBM (Obrigatório)</label>
              <SearchableSelect
                items={obmsParaSelecao}
                selectedId={cidadeId}
                onSelect={(id) => setCidadeId(id)}
                placeholder="Digite para buscar uma OBM"
                disabled={isEditing || usuario?.role === 'user'}
                highlightedIds={obmsComDados}
              />
            </div>
            <div className="flex min-w-[250px] flex-1 flex-col gap-2">
              <label htmlFor="data_ocorrencia" className="text-sm text-gray-400">Data da Ocorrência</label>
              <input
                id="data_ocorrencia" name="data_ocorrencia" type="date"
                value={dataOcorrencia} onChange={e => setDataOcorrencia(e.target.value)} required
                className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {ORDEM_GRUPOS.map(grupo => {
            const natsDoGrupo = naturezasAgrupadas[grupo];
            if (!natsDoGrupo) return null;

            return (
              <fieldset key={grupo} className="rounded-lg border border-gray-700 p-6">
                <legend className="px-2 text-lg font-bold text-yellow-400">{grupo}</legend>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 pt-2">
                  {natsDoGrupo.map((nat: IDataApoio) => (
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
            );
          })}
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
