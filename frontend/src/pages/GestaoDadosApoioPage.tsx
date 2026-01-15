// Caminho: frontend/src/pages/GestaoDadosApoioPage.tsx

import React, { useState, useEffect, useCallback, ReactElement, useMemo } from 'react';
import {
  getCidades, createUnidade, updateUnidade, deleteUnidade, getCrbms,
  getNaturezas, createNatureza, updateNatureza, deleteNatureza,
  IObm, ICrbm, IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataProvider';
import Spinner from '../components/Spinner';
import ObmCards from '../components/ObmCards'; // New component for OBM cards
import NaturezaCards from '../components/NaturezaCards'; // New component for Natureza cards

// ... (Componente DataModal não precisa de alterações) ...
type DataType = 'obm' | 'natureza';
type ItemType = IObm | IDataApoio;

interface DataModalProps {
  item: ItemType | null;
  type: DataType;
  onClose: () => void;
  onSave: (formData: any) => void;
  crbms: ICrbm[];
}

function DataModal({ item, type, onClose, onSave, crbms }: DataModalProps): ReactElement {
  const isEditing = !!item;
  const isObm = type === 'obm';
  const title = `${isEditing ? 'Editar' : 'Adicionar'} ${isObm ? 'OBM' : 'Natureza'}`;

  const getInitialState = () => {
    if (isObm) {
      const obmItem = item as IObm;
      return {
        nomes: isEditing ? [obmItem?.cidade_nome || ''] : [''],
        crbm_id: obmItem?.crbm_id || (crbms.length > 0 ? crbms[0].id : ''),
      };
    }
    const naturezaItem = item as IDataApoio;
    return {
      grupo: naturezaItem?.grupo || '',
      subgrupo: naturezaItem?.subgrupo || ''
    };
  };

  const [formData, setFormData] = useState<{ nomes: string[]; crbm_id: number } | { grupo: string; subgrupo: string }>(getInitialState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'crbm_id') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleObmNameChange = (index: number, value: string) => {
    setFormData(prev => {
      const obmFormData = prev as { nomes: string[]; crbm_id: number };
      const newNomes = [...obmFormData.nomes];
      newNomes[index] = value;
      return { ...prev, nomes: newNomes };
    });
  };

  const handleAddObmName = () => {
    setFormData(prev => {
      const obmFormData = prev as { nomes: string[]; crbm_id: number };
      return { ...prev, nomes: [...obmFormData.nomes, ''] };
    });
  };

  const handleRemoveObmName = (index: number) => {
    setFormData(prev => {
      const obmFormData = prev as { nomes: string[]; crbm_id: number };
      const newNomes = obmFormData.nomes.filter((_, i) => i !== index);
      return { ...prev, nomes: newNomes.length > 0 ? newNomes : [''] };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isObm) {
      const obmFormData = formData as { nomes: string[]; crbm_id: number };
      onSave({ crbm_id: obmFormData.crbm_id, nomes: obmFormData.nomes.filter(nome => nome.trim() !== '') });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface border border-border p-6 text-text shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold text-text-strong">{title}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isObm ? (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="crbm_id" className="text-sm text-text">CRBM</label>
                <select id="crbm_id" name="crbm_id" value={(formData as { crbm_id: number }).crbm_id} onChange={handleChange} className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                  {crbms.map(crbm => <option key={crbm.id} value={crbm.id}>{crbm.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text">Nome(s) da(s) OBM(s) (Unidade)</label>
                {(formData as { nomes: string[] }).nomes.map((nome, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      id={`nome-${index}`}
                      name={`nome-${index}`}
                      value={nome}
                      onChange={(e) => handleObmNameChange(index, e.target.value)}
                      required
                      className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    {((formData as { nomes: string[] }).nomes.length > 1 || isEditing) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObmName(index)}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddObmName}
                  className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Adicionar mais OBM
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="grupo" className="text-sm text-text">Grupo da Natureza</label>
                <input type="text" id="grupo" name="grupo" value={(formData as any).grupo} onChange={handleChange} required className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="subgrupo" className="text-sm text-text">Subgrupo da Natureza</label>
                <input type="text" id="subgrupo" name="subgrupo" value={(formData as any).subgrupo} onChange={handleChange} required className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-500 px-6 py-3 font-semibold text-white transition hover:bg-gray-600">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function GestaoDadosApoioPage(): ReactElement {
  const [activeTab, setActiveTab] = useState<DataType>('obm');
  const [obms, setObms] = useState<IObm[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [crbms, setCrbms] = useState<ICrbm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemType | null>(null);
  const { addNotification } = useNotification();
  const { refetch: refetchDataApoio } = useData();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // New state for mobile view

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [obmsData, naturezasData, crbmsData] = await Promise.all([getCidades(), getNaturezas(), getCrbms()]);
      setObms(obmsData);
      setNaturezas(naturezasData);
      setCrbms(crbmsData);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : 'Falha ao buscar dados de apoio.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item: ItemType | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemEmEdicao(null);
  };

  const handleSave = async (formData: any) => {
    const isEditing = !!itemEmEdicao;
    const typeName = activeTab === 'obm' ? 'OBM' : 'Natureza';
    const successMessage = `${typeName} ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;

    try {
      if (activeTab === 'obm') {
        if (isEditing) {
          const payload = { crbm_id: formData.crbm_id, nome: formData.nomes[0] };
          await updateUnidade(itemEmEdicao!.id, payload);
        } else {
          // Adicionar múltiplas OBMs
          const crbm_id = formData.crbm_id;
          const nomes = formData.nomes as string[];
          for (const nome of nomes) {
            if (nome.trim() !== '') {
              await createUnidade({ crbm_id, nome });
            }
          }
        }
      } else {
        const payload = { grupo: formData.grupo, subgrupo: formData.subgrupo };
        isEditing ? await updateNatureza(itemEmEdicao!.id, payload) : await createNatureza(payload);
      }
      addNotification(successMessage, 'success');
      handleCloseModal();
      fetchData();
      refetchDataApoio();
    } catch (err) {
      addNotification(err instanceof Error ? err.message : 'Falha ao salvar dados.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      try {
        activeTab === 'obm' ? await deleteUnidade(id) : await deleteNatureza(id);
        addNotification('Item excluído com sucesso!', 'success');
        fetchData();
      } catch (err) {
        addNotification(err instanceof Error ? err.message : 'Falha ao excluir item.', 'error');
      }
    }
  };

  // ======================= INÍCIO DA CORREÇÃO =======================
  // Agrupa as OBMs por CRBM para renderização com células mescladas
  const obmsAgrupadas = useMemo(() => {
    return obms.reduce((acc: Record<string, IObm[]>, obm) => {
      const crbmNome = obm.crbm_nome;
      if (!acc[crbmNome]) {
        acc[crbmNome] = [];
      }
      acc[crbmNome].push(obm);
      return acc;
    }, {});
  }, [obms]);

  const renderContent = () => {
    if (loading) {
      return <Spinner text="Carregando dados..." />;
    }

    if (activeTab === 'natureza') {
      return isMobile ? (
        <NaturezaCards naturezas={naturezas} handleOpenModal={handleOpenModal} handleDelete={handleDelete} />
      ) : (
        // Existing Natureza table
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-200 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Subgrupo</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {naturezas.map(item => (
                <tr key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 text-text-strong">
                  <td className="whitespace-nowrap px-6 py-4">{item.grupo}</td>
                  <td className="whitespace-nowrap px-6 py-4">{item.subgrupo}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenModal(item)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // activeTab === 'obm'
    return isMobile ? (
      <ObmCards obmsAgrupadas={obmsAgrupadas} handleOpenModal={handleOpenModal} handleDelete={handleDelete} />
    ) : (
      // Existing OBM table
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">CRBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text">Nome da OBM</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {Object.entries(obmsAgrupadas).map(([crbmNome, listaObms]) => (
              <React.Fragment key={crbmNome}>
                {listaObms.map((obm, index) => (
                  <tr key={obm.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 text-text-strong">
                    {index === 0 && (
                      <td rowSpan={listaObms.length} className="whitespace-nowrap px-6 py-4 align-top font-semibold border-r border-border">{crbmNome}</td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4">{obm.cidade_nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(obm)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                        <button onClick={() => handleDelete(obm.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  // ======================= FIM DA CORREÇÃO =======================

  return (
    <MainLayout pageTitle="Gerenciar Dados de Apoio">
      <div className="mb-6 flex border-b border-border">
        <button onClick={() => setActiveTab('obm')} className={`px-6 py-3 text-lg font-medium transition-colors ${activeTab === 'obm' ? 'border-b-2 border-teal-500 text-teal-500' : 'text-text hover:text-text-strong'}`}>
          Gestão de OBMs
        </button>
        <button onClick={() => setActiveTab('natureza')} className={`px-6 py-3 text-lg font-medium transition-colors ${activeTab === 'natureza' ? 'border-b-2 border-teal-500 text-teal-500' : 'text-text hover:text-text-strong'}`}>
          Naturezas de Ocorrência
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 md:p-6">
        <div className="mb-6">
          <button onClick={() => handleOpenModal()} className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700">
            Adicionar Nov{activeTab === 'obm' ? 'a OBM' : 'a Natureza'}
          </button>
        </div>
        {loading ? <Spinner text="Carregando dados..." /> : renderContent()}
      </div>

      {isModalOpen && (
        <DataModal
          item={itemEmEdicao}
          type={activeTab}
          onClose={handleCloseModal}
          onSave={handleSave}
          crbms={crbms}
        />
      )}
    </MainLayout>
  );
}

export default GestaoDadosApoioPage;
