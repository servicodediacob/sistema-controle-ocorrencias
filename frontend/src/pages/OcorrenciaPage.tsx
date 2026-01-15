// frontend/src/pages/GestaoOcorrenciasPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { getOcorrencias, deleteOcorrencia, updateOcorrencia, IPaginatedOcorrencias, IOcorrencia } from '../services/api';
import OcorrenciaTable from '../components/OcorrenciaTable';
import EditOcorrenciaModal from '../components/EditOcorrenciaModal';
import Pagination from '../components/Pagination';

// ESTA PÁGINA NÃO RECEBE PROPS
function GestaoOcorrenciasPage(): ReactElement {
  const [data, setData] = useState<IPaginatedOcorrencias>({ ocorrencias: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocorrenciaEmEdicao, setOcorrenciaEmEdicao] = useState<IOcorrencia | null>(null);

  const fetchOcorrencias = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getOcorrencias(page);
      setData(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao buscar ocorrências.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOcorrencias(1);
  }, [fetchOcorrencias]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= data.pagination.totalPages) {
      fetchOcorrencias(newPage);
    }
  };

  const handleEdit = (ocorrencia: IOcorrencia) => {
    setOcorrenciaEmEdicao(ocorrencia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOcorrenciaEmEdicao(null);
  };

  const handleSave = async (updatedOcorrencia: IOcorrencia) => {
    try {
      const dataToUpdate = {
        data_ocorrencia: updatedOcorrencia.data_ocorrencia.split('T')[0],
        natureza_id: updatedOcorrencia.natureza_id,
        obm_id: updatedOcorrencia.obm_id,
      };
      await updateOcorrencia(updatedOcorrencia.id, dataToUpdate);
      alert('Ocorrência atualizada com sucesso!');
      handleCloseModal();
      fetchOcorrencias(data.pagination.page);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar ocorrência.';
      setError(errorMessage);
      alert(`Erro: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.')) {
      try {
        await deleteOcorrencia(id);
        alert('Ocorrência excluída com sucesso!');
        if (data.ocorrencias.length === 1 && data.pagination.page > 1) {
          fetchOcorrencias(data.pagination.page - 1);
        } else {
          fetchOcorrencias(data.pagination.page);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao excluir ocorrência.';
        setError(errorMessage);
        alert(`Erro: ${errorMessage}`);
      }
    }
  };

  const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem' },
    error: { color: 'red', marginTop: '1rem' },
    backLink: { color: '#8bf', textDecoration: 'none' },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Gestão de Ocorrências</h1>
        <Link to="/dashboard" style={styles.backLink}>Voltar para o Dashboard</Link>
      </header>

      {error && <p style={styles.error}>{error}</p>}

      <OcorrenciaTable
        ocorrencias={data.ocorrencias}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Pagination
        pagination={data.pagination}
        onPageChange={handlePageChange}
      />

      {isModalOpen && (
        <EditOcorrenciaModal
          ocorrencia={ocorrenciaEmEdicao}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default GestaoOcorrenciasPage;
