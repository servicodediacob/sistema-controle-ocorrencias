import { useState, useEffect, useCallback, ReactElement, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  getUnidades, createUnidade, updateUnidade, deleteUnidade, getCrbms,
  getNaturezas, createNatureza, updateNatureza, deleteNatureza,
  IUnidade, ICrbm, IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

type DataType = 'unidade' | 'natureza';

// --- Componente do Modal ---
interface DataModalProps {
  item: IUnidade | IDataApoio | null;
  type: DataType;
  onClose: () => void;
  onSave: (formData: any) => void;
  crbms: ICrbm[];
}

function DataModal({ item, type, onClose, onSave, crbms }: DataModalProps) {
  const isEditing = !!item;
  const isUnidade = type === 'unidade';
  const title = `${isEditing ? 'Editar' : 'Adicionar'}`;

  const getInitialState = () => {
    if (isUnidade) {
      const unidadeItem = item as IUnidade;
      return {
        cidade_nome: unidadeItem?.cidade_nome || '',
        crbm_id: unidadeItem?.crbm_id || (crbms.length > 0 ? crbms[0].id : 1),
      };
    }
    const naturezaItem = item as IDataApoio;
    return { descricao: naturezaItem?.descricao || '' };
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
        <h2>{`${title} ${isUnidade ? 'Unidade' : 'Natureza'}`}</h2>
        <form onSubmit={handleSubmit}>
          {isUnidade ? (
            <>
              <div style={styles.formGroup}>
                <label htmlFor="crbm_id" style={styles.label}>CRBM</label>
                <select id="crbm_id" name="crbm_id" value={formData.crbm_id} onChange={handleChange} style={styles.input}>
                  {crbms.map(crbm => <option key={crbm.id} value={crbm.id}>{crbm.nome}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="cidade_nome" style={styles.label}>Nome da Cidade</label>
                <input type="text" id="cidade_nome" name="cidade_nome" value={formData.cidade_nome} onChange={handleChange} required style={styles.input} />
              </div>
            </>
          ) : (
            <div style={styles.formGroup}>
              <label htmlFor="descricao" style={styles.label}>Descrição da Natureza</label>
              <input type="text" id="descricao" name="descricao" value={(formData as any).descricao} onChange={handleChange} required style={styles.input} />
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

// --- Componente Principal da Página ---
function GestaoDadosApoioPage(): ReactElement {
  const [activeTab, setActiveTab] = useState<DataType>('unidade');
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [crbms, setCrbms] = useState<ICrbm[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<IUnidade | IDataApoio | null>(null);
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [unidadesData, naturezasData, crbmsData] = await Promise.all([
        getUnidades(), 
        getNaturezas(),
        getCrbms()
      ]);
      setUnidades(unidadesData);
      setNaturezas(naturezasData);
      setCrbms(crbmsData);
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

  const handleOpenModal = (item: IUnidade | IDataApoio | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemEmEdicao(null);
  };

  const handleSave = async (formData: any) => {
    const isEditing = !!itemEmEdicao;
    const typeName = activeTab === 'unidade' ? 'Unidade' : 'Natureza';
    const successMessage = `${typeName} ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;
    
    try {
      if (activeTab === 'unidade') {
        const payload = { crbm_id: formData.crbm_id, cidade_nome: formData.cidade_nome };
        isEditing ? await updateUnidade(itemEmEdicao!.id, payload) : await createUnidade(payload);
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
        activeTab === 'unidade' ? await deleteUnidade(id) : await deleteNatureza(id);
        addNotification('Item excluído com sucesso!', 'success');
        fetchData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao excluir item.';
        addNotification(message, 'error');
      }
    }
  };

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

  const renderTable = () => {
    const isUnidade = activeTab === 'unidade';
    const data = isUnidade ? unidades : naturezas;
    const columns = isUnidade 
      ? [{ key: 'crbm_nome', header: 'CRBM' }, { key: 'cidade_nome', header: 'Cidade' }]
      : [{ key: 'id', header: 'ID' }, { key: 'descricao', header: 'Descrição' }];

    return (
      <>
        <button onClick={() => handleOpenModal()} style={{...styles.button, backgroundColor: '#2a9d8f'}}>
          Adicionar Nov{isUnidade ? 'a Unidade' : 'a Natureza'}
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
                {columns.map(col => <td key={col.key} style={styles.td}>{(item as any)[col.key]}</td>)}
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
        <button onClick={() => setActiveTab('unidade')} style={{...styles.tab, ...(activeTab === 'unidade' && styles.activeTab)}}>
          Gestão de Unidades
        </button>
        <button onClick={() => setActiveTab('natureza')} style={{...styles.tab, ...(activeTab === 'natureza' && styles.activeTab)}}>
          Naturezas de Ocorrência
        </button>
      </div>

      {loading ? <p>Carregando...</p> : renderTable()}

      {isModalOpen && (
        <DataModal
          item={itemEmEdicao}
          type={activeTab}
          onClose={handleCloseModal}
          onSave={handleSave}
          crbms={crbms}
        />
      )}
    </div>
  );
}

export default GestaoDadosApoioPage;
