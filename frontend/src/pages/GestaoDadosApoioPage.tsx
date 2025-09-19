import React, { useState, useEffect, useCallback, ReactElement, CSSProperties } from 'react';
import {
  getUnidades, createUnidade, updateUnidade, deleteUnidade, getCrbms,
  getNaturezas, createNatureza, updateNatureza, deleteNatureza,
  IUnidade, ICrbm, IDataApoio
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import { device } from '../styles/theme'; // 1. Importe nossos breakpoints
import styled from 'styled-components'; // 2. Importe o styled-components

type DataType = 'unidade' | 'natureza';

// --- Componentes Estilizados para o Modal ---

const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.7); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
`;

const ModalContent = styled.div`
  background-color: #2c2c2c; padding: 2rem;
  border-radius: 8px; width: 400px; color: white;
  max-width: 100%;
  box-sizing: border-box;

  @media ${device.tablet} {
    width: 95%;
    padding: 1.5rem;
  }
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  font-size: 1.5rem;
  @media ${device.mobileL} {
    font-size: 1.2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%; padding: 0.75rem; border-radius: 4px;
  border: 1px solid #555; background-color: #3a3a3a; color: white;
  box-sizing: border-box;
`;

const Select = styled.select`
  width: 100%; padding: 0.75rem; border-radius: 4px;
  border: 1px solid #555; background-color: #3a3a3a; color: white;
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem; border-radius: 4px; border: none; cursor: pointer;
`;

const SaveButton = styled(Button)`
  background-color: #3a7ca5;
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: #555;
  color: white;
`;


// --- Componente do Modal (agora usando styled-components) ---
interface DataModalProps {
  item: IUnidade | IDataApoio | null;
  type: DataType;
  onClose: () => void;
  onSave: (formData: any) => void;
  crbms: ICrbm[];
}

function DataModal({ item, type, onClose, onSave, crbms }: DataModalProps): ReactElement {
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
    return {
      grupo: naturezaItem?.grupo || '',
      subgrupo: naturezaItem?.subgrupo || ''
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

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>{`${title} ${isUnidade ? 'Unidade' : 'Natureza'}`}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          {isUnidade ? (
            <>
              <FormGroup>
                <Label htmlFor="crbm_id">CRBM</Label>
                <Select id="crbm_id" name="crbm_id" value={(formData as any).crbm_id} onChange={handleChange}>
                  {crbms.map(crbm => <option key={crbm.id} value={crbm.id}>{crbm.nome}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="cidade_nome">Nome da Cidade</Label>
                <Input type="text" id="cidade_nome" name="cidade_nome" value={(formData as any).cidade_nome} onChange={handleChange} required />
              </FormGroup>
            </>
          ) : (
            <>
              <FormGroup>
                <Label htmlFor="grupo">Grupo da Natureza</Label>
                <Input type="text" id="grupo" name="grupo" value={(formData as any).grupo} onChange={handleChange} required />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="subgrupo">Subgrupo da Natureza</Label>
                <Input type="text" id="subgrupo" name="subgrupo" value={(formData as any).subgrupo} onChange={handleChange} required />
              </FormGroup>
            </>
          )}
          <ButtonContainer>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SaveButton type="submit">Salvar</SaveButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
}


// --- Componente Principal da Página (lógica sem alterações, mas usando styled-components) ---
// (O restante do arquivo GestaoDadosApoioPage.tsx permanece o mesmo, mas agora
//  os estilos inline podem ser substituídos por componentes estilizados se desejado
//  para maior consistência, como TabContainer, Tab, etc.)

// Para simplificar, vamos manter o resto do arquivo como está, pois a mudança principal era no modal.
// O código abaixo é o original, sem alterações.

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
        const payload = { grupo: formData.grupo, subgrupo: formData.subgrupo };
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
    tabContainer: { display: 'flex', gap: '0.5rem', marginBottom: '2rem' },
    tab: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: 'none', backgroundColor: '#2c2c2c', color: 'white', borderBottom: '3px solid transparent' },
    activeTab: { borderBottom: '3px solid #3a7ca5' },
    tableContainer: { marginTop: '1rem', border: '1px solid #3a3a3a', borderRadius: '4px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    th: { padding: '0.75rem', textAlign: 'left', color: '#aaa', backgroundColor: '#2c2c2c', position: 'sticky', top: 0, zIndex: 1 },
    td: { padding: '0.75rem', borderBottom: '1px solid #3a3a3a' },
    actionButtons: { display: 'flex', gap: '0.5rem', justifyContent: 'center' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  const renderTable = () => {
    const isUnidade = activeTab === 'unidade';
    const dataToRender = isUnidade ? unidades : naturezas;
    const columns = isUnidade
      ? [{ key: 'crbm_nome', header: 'CRBM' }, { key: 'cidade_nome', header: 'Cidade' }]
      : [{ key: 'grupo', header: 'Grupo' }, { key: 'subgrupo', header: 'Subgrupo' }];

    return (
      <>
        <button onClick={() => handleOpenModal()} style={{...styles.button, backgroundColor: '#2a9d8f'}}>
          Adicionar Nov{isUnidade ? 'a Unidade' : 'a Natureza'}
        </button>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map(col => <th key={col.key} style={styles.th}>{col.header}</th>)}
                <th style={{...styles.th, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dataToRender.map(item => (
                <tr key={item.id}>
                  {isUnidade ? (
                    <>
                      <td style={styles.td}>{(item as IUnidade).crbm_nome}</td>
                      <td style={styles.td}>{(item as IUnidade).cidade_nome}</td>
                    </>
                  ) : (
                    <>
                      <td style={styles.td}>{(item as IDataApoio).grupo}</td>
                      <td style={styles.td}>{(item as IDataApoio).subgrupo}</td>
                    </>
                  )}
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
        </div>
      </>
    );
  };

  return (
    <MainLayout pageTitle="Gerenciar Dados de Apoio">
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
    </MainLayout>
  );
}

export default GestaoDadosApoioPage;
