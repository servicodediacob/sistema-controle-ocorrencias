// Caminho: frontend/src/pages/GestaoOcorrenciasPage.tsx

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { getOcorrencias, deleteOcorrencia, updateOcorrencia, IPaginatedOcorrencias, IOcorrencia } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import OcorrenciaTable from '../components/OcorrenciaTable';
import EditOcorrenciaModal from '../components/EditOcorrenciaModal';
import Pagination from '../components/Pagination';

function GestaoOcorrenciasPage(): ReactElement {
  const [data, setData] = useState<IPaginatedOcorrencias>({ 
    ocorrencias: [], 
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } 
  });
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocorrenciaEmEdicao, setOcorrenciaEmEdicao] = useState<IOcorrencia | null>(null);
  const { addNotification } = useNotification();

  const fetchOcorrencias = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await getOcorrencias(page);
      setData(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar ocorrências.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

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
      
      addNotification('Ocorrência atualizada com sucesso!', 'success');
      handleCloseModal();
      fetchOcorrencias(data.pagination.page);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar ocorrência.';
      addNotification(errorMessage, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.')) {
      try {
        await deleteOcorrencia(id);
        addNotification('Ocorrência excluída com sucesso!', 'success');
        
        if (data.ocorrencias.length === 1 && data.pagination.page > 1) {
          fetchOcorrencias(data.pagination.page - 1);
        } else {
          fetchOcorrencias(data.pagination.page);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao excluir ocorrência.';
        addNotification(errorMessage, 'error');
      }
    }
  };

  return (
    <MainLayout pageTitle="Gestão de Ocorrências">
      {/* ======================= CORREÇÃO APLICADA ======================= */}
      {/* O componente da tabela agora está dentro de um contêiner que usa as cores do tema */}
      <div className="bg-surface border border-border rounded-lg p-4 md:p-6">
        <OcorrenciaTable
          ocorrencias={data.ocorrencias}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

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
    </MainLayout>
  );
}

export default GestaoOcorrenciasPage;
