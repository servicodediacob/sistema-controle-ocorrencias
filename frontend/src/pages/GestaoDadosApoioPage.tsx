// frontend/src/pages/GestaoDadosApoioPage.tsx

import { useState, useEffect, useCallback, ReactElement, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  getObms, createObm, updateObm, deleteObm,
  getNaturezas, createNatureza, updateNatureza, deleteNatureza,
  IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext'; // Usar o sistema de notificação

type DataType = 'obm' | 'natureza';

// --- Componente do Modal (Refatorado para clareza) ---
interface DataModalProps {
  item: IDataApoio | null;
  type: DataType;
  onClose: () => void;
  onSave: (formData: any) => void;
}

function DataModal({ item, type, onClose, onSave }: DataModalProps): ReactElement {
  const isEditing = !!item;
  const isObm = type === 'obm';
  const title = `${isEditing ? 'Editar' : 'Adicionar Nova'} ${isObm ? 'OBM' : 'Natureza'}`;

  // Estado inicial baseado no tipo e se é edição ou criação
  const getInitialState = () => {
    if (isObm) {
      return {
        nome: item?.nome || '',
        crbm_id: item?.crbm_id || 1, // Default para CRBM I
      };
    }
    return {
      descricao: item?.descricao || '',
    };
  };

  const [formData, setFormData] = useState(getInitialState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'crbm_id' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };

  // Estilos (sem alteração)
  const styles: { [key: string]: CSSProperties } = {
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#2c2c2c', padding: '2rem', borderRadius: '8px', width: '400px', color: 'white' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#3a3a3a', color: 'white' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          {isObm ? (
            <>
              <div style={styles.formGroup}>
                <label htmlFor="nome" style={styles.label}>Nome da OBM</label>
                <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="crbm_id" style={styles.label}>CRBM</label>
                <select id="crbm_id" name="crbm_id" value={formData.crbm_id} onChange={handleChange} style={styles.input}>
                  <option value={1}>CRBM I</option>
                  <option value={2}>CRBM II</option>
                </select>
              </div>
            </>
          ) : (
            <div style={styles.formGroup}>
              <label htmlFor="descricao" style={styles.label}>Descrição da Natureza</label>
              <input type="text" id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} required style={styles.input} />
            </div>
          )}
          <div style={styles.buttonContainer}>
            <button type="button" onClick={onClose} style={{...styles.button, backgroundColor: '#555'}}>Cancelar</button>
            <button type="submit" style={{...styles.button, backgroundColor: '#3a7ca5'}}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Componente Principal da Página (com as correções) ---
function GestaoDadosApoioPage(): ReactElement {
  const [activeTab, setActiveTab] = useState<DataType>('obm'); // Tipo explícito
  const [obms, setObms] = useState<IDataApoio[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<IDataApoio | null>(null);
  const { addNotification } = useNotification(); // Hook de notificação

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [obmsData, naturezasData] = await Promise.all([getObms(), getNaturezas()]);
      setObms(obmsData);
      setNaturezas(naturezasData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar dados de apoio.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item: IDataApoio | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemEmEdicao(null);
  };

  const handleSave = async (formData: any) => {
    const isEditing = !!itemEmEdicao;
    const successMessage = `${activeTab === 'obm' ? 'OBM' : 'Natureza'} ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;
    
    try {
      if (activeTab === 'obm') {
        const payload = { nome: formData.nome, crbm_id: formData.crbm_id };
        isEditing ? await updateObm(itemEmEdicao!.id, payload) : await createObm(payload);
      } else {
        const payload = { descricao: formData.descricao };
        isEditing ? await updateNatureza(itemEmEdicao!.id, payload) : await createNatureza(payload);
      }
      addNotification(successMessage, 'success');
      handleCloseModal();
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar dados.';
      addNotification(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      try {
        activeTab === 'obm' ? await deleteObm(id) : await deleteNatureza(id);
        addNotification('Item excluído com sucesso!', 'success');
        fetchData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao excluir item.';
        addNotification(message, 'error');
      }
    }
  };

  // Estilos (sem alteração)
  const styles: { [key: string]: CSSProperties } = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem', marginBottom: '1rem' },
    tabContainer: { display: 'flex', gap: '0.5rem', marginBottom: '2rem' },
    tab: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: 'none', backgroundColor: '#2c2c2c', color: 'white', borderBottom: '3px solid transparent' },
    activeTab: { borderBottom: '3px solid #3a7ca5' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    actionButtons: { display: 'flex', gap: '0.5rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    backLink: { color: '#8bf', textDecoration: 'none' },
  };

  // --- Função de Renderização da Tabela (CORRIGIDA) ---
  const renderTable = () => {
    const isObm = activeTab === 'obm';
    const data = isObm ? obms : naturezas;
    const columns = isObm 
      ? [{ key: 'id', header: 'ID' }, { key: 'nome', header: 'Nome' }, { key: 'crbm_id', header: 'CRBM ID' }]
      : [{ key: 'id', header: 'ID' }, { key: 'descricao', header: 'Descrição' }];

    return (
      <>
        {/* CORREÇÃO: O texto do botão agora é dinâmico */}
        <button onClick={() => handleOpenModal()} style={{...styles.button, backgroundColor: '#2a9d8f'}}>
          Adicionar Nov{isObm ? 'a OBM' : 'a Natureza'}
        </button>
        
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key} style={styles.th}>{col.header}</th>)}
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                {columns.map(col => <td key={col.key} style={styles.td}>{item[col.key as keyof IDataApoio]}</td>)}
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button onClick={() => handleOpenModal(item)} style={{...styles.button, backgroundColor: '#e9c46a', color: 'black'}}>Editar</button>
                    <button onClick={() => handleDelete(item.id)} style={{...styles.button, backgroundColor: '#e76f51'}}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Gerenciar Dados de Apoio</h1>
        <Link to="/dashboard" style={styles.backLink}>Voltar para o Dashboard</Link>
      </header>

      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('obm')} style={{...styles.tab, ...(activeTab === 'obm' && styles.activeTab)}}>
          OBMs
        </button>
        <button onClick={() => setActiveTab('natureza')} style={{...styles.tab, ...(activeTab === 'natureza' && styles.activeTab)}}>
          Naturezas de Ocorrência
        </button>
      </div>

      {loading ? <p>Carregando...</p> : renderTable()}

      {isModalOpen && (
        <DataModal
          item={itemEmEdicao}
          type={activeTab} // Passa a aba ativa para o modal saber o que renderizar
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default GestaoDadosApoioPage;
