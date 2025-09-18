import { useState, useEffect, useCallback, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { 
  getOcorrencias, 
  deleteOcorrencia, 
  updateOcorrencia, 
  IPaginatedOcorrencias, 
  IOcorrencia 
} from '../services/api';
import OcorrenciaTable from '../components/OcorrenciaTable';
import EditOcorrenciaModal from '../components/EditOcorrenciaModal';
import Pagination from '../components/Pagination';
import { useNotification } from '../contexts/NotificationContext'; // Importa o hook de notificação

function GestaoOcorrenciasPage(): ReactElement {
  // Estado para armazenar os dados paginados das ocorrências
  const [data, setData] = useState<IPaginatedOcorrencias>({ 
    ocorrencias: [], 
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } 
  });
  
  // Estados para controlar a UI
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocorrenciaEmEdicao, setOcorrenciaEmEdicao] = useState<IOcorrencia | null>(null);

  // Hook para disparar notificações
  const { addNotification } = useNotification();

  // Função para buscar as ocorrências da API, com useCallback para otimização
  const fetchOcorrencias = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await getOcorrencias(page);
      setData(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar ocorrências.';
      addNotification(message, 'error'); // Exibe notificação de erro
    } finally {
      setLoading(false);
    }
  }, [addNotification]); // Adiciona 'addNotification' como dependência do useCallback

  // Efeito para buscar os dados quando o componente é montado
  useEffect(() => {
    fetchOcorrencias(1);
  }, [fetchOcorrencias]);

  // Manipulador para mudança de página na paginação
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= data.pagination.totalPages) {
      fetchOcorrencias(newPage);
    }
  };

  // Abre o modal de edição com os dados da ocorrência selecionada
  const handleEdit = (ocorrencia: IOcorrencia) => {
    setOcorrenciaEmEdicao(ocorrencia);
    setIsModalOpen(true);
  };

  // Fecha o modal de edição
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOcorrenciaEmEdicao(null);
  };

  // Salva as alterações da ocorrência (criação ou edição)
  const handleSave = async (updatedOcorrencia: IOcorrencia) => {
    try {
      // Prepara o payload com os dados necessários para a API
      const dataToUpdate = {
        data_ocorrencia: updatedOcorrencia.data_ocorrencia.split('T')[0], // Formata a data
        natureza_id: updatedOcorrencia.natureza_id,
        obm_id: updatedOcorrencia.obm_id,
      };
      await updateOcorrencia(updatedOcorrencia.id, dataToUpdate);
      
      addNotification('Ocorrência atualizada com sucesso!', 'success'); // Exibe notificação de sucesso
      handleCloseModal();
      fetchOcorrencias(data.pagination.page); // Recarrega os dados da página atual
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar ocorrência.';
      addNotification(errorMessage, 'error'); // Exibe notificação de erro
    }
  };

  // Exclui uma ocorrência
  const handleDelete = async (id: number) => {
    // Pede confirmação ao usuário antes de uma ação destrutiva
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.')) {
      try {
        await deleteOcorrencia(id);
        addNotification('Ocorrência excluída com sucesso!', 'success'); // Exibe notificação de sucesso
        
        // Lógica para voltar uma página se o último item da página atual for excluído
        if (data.ocorrencias.length === 1 && data.pagination.page > 1) {
          fetchOcorrencias(data.pagination.page - 1);
        } else {
          fetchOcorrencias(data.pagination.page);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao excluir ocorrência.';
        addNotification(errorMessage, 'error'); // Exibe notificação de erro
      }
    }
  };

  // Estilos do componente
  const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem' },
    backLink: { color: '#8bf', textDecoration: 'none' },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Gestão de Ocorrências</h1>
        <Link to="/dashboard" style={styles.backLink}>Voltar para o Dashboard</Link>
      </header>

      {/* Componente da tabela de ocorrências */}
      <OcorrenciaTable
        ocorrencias={data.ocorrencias}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Componente de paginação */}
      <Pagination
        pagination={data.pagination}
        onPageChange={handlePageChange}
      />

      {/* Modal de edição, renderizado condicionalmente */}
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
