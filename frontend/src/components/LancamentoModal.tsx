import React, { useState, useEffect } from 'react';
import { ICidade, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/useAuth'; // 1. Importe o useAuth

function LancamentoModal({ cidades, naturezas, onClose, onSave, itemParaEditar }: any) {
  const { addNotification } = useNotification();
  const { usuario } = useAuth(); // 2. Obtenha os dados do usuário logado
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

  useEffect(() => {
    // Se for um usuário comum, trava o seletor na OBM dele
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

  // 3. Filtra a lista de cidades se o usuário não for admin
  const cidadesDisponiveis = usuario?.role === 'admin'
    ? cidades
    : cidades.filter((c: ICidade) => c.id === usuario?.obm_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-gray-800 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="flex-shrink-0 border-b border-gray-700 p-6 text-xl font-semibold">
          {isEditing ? `Editando Lançamentos de ${itemParaEditar.cidade.cidade_nome}` : 'Formulário de Lançamento de Ocorrências'}
        </h2>
        <form id="lancamento-form" onSubmit={handleSubmit} className="flex flex-grow flex-col gap-6 overflow-y-auto p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex min-w-[250px] flex-1 flex-col gap-2">
              <label htmlFor="cidade_id" className="text-sm text-gray-400">OBM (Obrigatório)</label>
              <select
                id="cidade_id" name="cidade_id" value={cidadeId}
                onChange={e => setCidadeId(Number(e.target.value))}
                required
                // 4. Desabilita o seletor se for edição OU se for usuário comum
                disabled={isEditing || usuario?.role === 'user'}
                className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>Selecione uma OBM</option>
                {cidadesDisponiveis.map((c: ICidade) => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
              </select>
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
