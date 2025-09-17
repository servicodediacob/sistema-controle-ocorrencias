import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOcorrencias, deleteOcorrencia, updateOcorrencia } from '../services/api';
import OcorrenciaTable from '../components/OcorrenciaTable';
import EditOcorrenciaModal from '../components/EditOcorrenciaModal';
import Pagination from '../components/Pagination'; // <-- 1. Importar o componente de paginação

function GestaoOcorrenciasPage() {
  const [data, setData] = useState({ ocorrencias: [], pagination: { page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocorrenciaEmEdicao, setOcorrenciaEmEdicao] = useState(null);

  // A função agora aceita a página como argumento
  const fetchOcorrencias = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getOcorrencias(page);
      setData(response);
    } catch (err) {
      setError(err.message || 'Falha ao buscar ocorrências.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOcorrencias(1); // Busca a primeira página ao carregar
  }, []);

  // --- 2. Função para lidar com a mudança de página ---
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= data.pagination.totalPages) {
      fetchOcorrencias(newPage);
    }
  };

  const handleEdit = (ocorrencia) => {
    setOcorrenciaEmEdicao(ocorrencia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOcorrenciaEmEdicao(null);
  };

  const handleSave = async (updatedOcorrencia) => {
    try {
      const dataToUpdate = {
        data_ocorrencia: updatedOcorrencia.data_ocorrencia,
        natureza_id: parseInt(updatedOcorrencia.natureza_id, 10),
        obm_id: parseInt(updatedOcorrencia.obm_id, 10),
      };
      await updateOcorrencia(updatedOcorrencia.id, dataToUpdate);
      alert('Ocorrência atualizada com sucesso!');
      handleCloseModal();
      fetchOcorrencias(data.pagination.page);
    } catch (err) {
      setError(err.message || 'Falha ao atualizar ocorrência.');
      alert(`Erro: ${err.message || 'Falha ao atualizar ocorrência.'}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.')) {
      try {
        await deleteOcorrencia(id);
        alert('Ocorrência excluída com sucesso!');
        // Se a página ficar vazia após a exclusão, volta para a página anterior
        if (data.ocorrencias.length === 1 && data.pagination.page > 1) {
          fetchOcorrencias(data.pagination.page - 1);
        } else {
          fetchOcorrencias(data.pagination.page);
        }
      } catch (err) {
        setError(err.message || 'Falha ao excluir ocorrência.');
        alert(`Erro: ${err.message || 'Falha ao excluir ocorrência.'}`);
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

      {/* --- 3. Adicionar o componente de paginação --- */}
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
