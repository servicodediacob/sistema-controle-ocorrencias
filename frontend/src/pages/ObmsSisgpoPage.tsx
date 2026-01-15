import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { useNotification } from '../contexts/NotificationContext';
import { sisgpoApi } from '../services/api';
import { ApiListResponse, Obm, SisgpoPagination, ValidationError } from '../types/sisgpo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import FileUploadCard from '../components/sisgpo/FileUploadCard';
import ObmForm, { ObmFormPayload } from '../components/sisgpo/ObmForm';

const PAGE_SIZE = 15;

const ObmsSisgpoPage = () => {
  const { addNotification } = useNotification();
  const [obms, setObms] = useState<Obm[]>([]);
  const [filters, setFilters] = useState<{ nome: string }>({ nome: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SisgpoPagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Obm | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const activeFilters = useMemo(
    () => (filters.nome ? { nome: filters.nome } : {}),
    [filters]
  );

  const fetchObms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sisgpoApi.get<ApiListResponse<Obm>>('/admin/obms', {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        ...activeFilters,
      });
      setObms(response.data ?? []);
      setPagination(
        response.pagination ?? {
          currentPage,
          totalPages: 1,
        }
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Nao foi possivel carregar as OBMs.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, addNotification, currentPage]);

  useEffect(() => {
    fetchObms();
  }, [fetchObms]);

  const totalObms = pagination?.totalRecords ?? obms.length;
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome: event.target.value });
    setCurrentPage(1);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await sisgpoApi.post('/admin/obms/upload-csv', formData);
      addNotification('Arquivo enviado com sucesso.', 'success');
      fetchObms();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao enviar o arquivo.';
      addNotification(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (payload: ObmFormPayload) => {
    setIsSaving(true);
    setFormErrors([]);
    try {
      if (payload.id) {
        await sisgpoApi.put(`/admin/obms/${payload.id}`, payload);
      } else {
        await sisgpoApi.post('/admin/obms', payload);
      }
      addNotification('OBM salva com sucesso.', 'success');
      setIsFormOpen(false);
      setEditing(null);
      fetchObms();
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
      const message = error?.response?.data?.message || 'Nao foi possivel salvar a OBM.';
      addNotification(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await sisgpoApi.delete(`/admin/obms/${deleteId}`);
      addNotification('OBM excluida com sucesso.', 'success');
      fetchObms();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao excluir a OBM.';
      addNotification(message, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await sisgpoApi.delete('/admin/obms');
      addNotification('Todas as OBMs foram removidas.', 'success');
      fetchObms();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao limpar as OBMs.';
      addNotification(message, 'error');
    } finally {
      setClearingAll(false);
      setConfirmClear(false);
    }
  };

  return (
    <MainLayout pageTitle="OBMs (SISGPO)">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Gerenciar OBMs</h1>
          <p className="text-sm text-text">Cadastre e mantenha atualizadas as unidades operacionais.</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-1 text-sm font-semibold text-blue-100">
            <span>Total</span>
            <span className="text-lg">{totalObms}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => {
              setEditing(null);
              setFormErrors([]);
              setIsFormOpen(true);
            }}
          >
            Adicionar OBM
          </Button>
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            Limpar tudo
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <FileUploadCard
          title="Importar/Atualizar OBMs"
          description="Envie uma planilha para atualizar as unidades no SISGPO."
          isLoading={isUploading}
          onUpload={handleUpload}
        />

        <div className="rounded-lg border border-border bg-surface p-4">
          <Label htmlFor="nome-obm">Filtrar por nome</Label>
          <Input
            id="nome-obm"
            value={filters.nome}
            onChange={handleFilterChange}
            placeholder="Digite parte do nome da OBM"
          />
        </div>

        <div className="rounded-lg border border-border bg-surface">
          {loading ? (
            <div className="py-16">
              <Spinner text="Carregando OBMs..." />
            </div>
          ) : obms.length === 0 ? (
            <p className="py-8 text-center text-text">Nenhuma OBM encontrada.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Sigla
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Cidade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        CRBM
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {obms.map((obm) => (
                      <tr key={obm.id}>
                        <td className="px-4 py-3 text-sm font-semibold text-text-strong">{obm.nome}</td>
                        <td className="px-4 py-3 text-sm text-text">{obm.abreviatura}</td>
                        <td className="px-4 py-3 text-sm text-text">{obm.cidade || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-text">{obm.crbm || 'N/A'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-1 text-xs"
                              onClick={() => {
                                setEditing(obm);
                                setFormErrors([]);
                                setIsFormOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="px-3 py-1 text-xs"
                              onClick={() => setDeleteId(obm.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {obms.map((obm) => (
                  <div
                    key={obm.id}
                    className="rounded-lg border border-border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-text">Nome</p>
                        <p className="text-base font-semibold text-text-strong">{obm.nome}</p>
                        <p className="text-sm text-text">{obm.abreviatura}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-text">
                      <p>
                        <span className="font-semibold text-text-strong">Cidade:</span>{' '}
                        {obm.cidade || 'Nao informado'}
                      </p>
                      <p>
                        <span className="font-semibold text-text-strong">CRBM:</span>{' '}
                        {obm.crbm || 'Nao informado'}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setEditing(obm);
                          setFormErrors([]);
                          setIsFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="flex-1"
                        onClick={() => setDeleteId(obm.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-border px-4 py-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.currentPage <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-text">
                Pagina {pagination.currentPage} de {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
          setFormErrors([]);
        }}
        title={editing ? 'Editar OBM' : 'Adicionar OBM'}
      >
        <ObmForm
          initialData={editing}
          options={obms}
          errors={formErrors}
          isSaving={isSaving}
          onSubmit={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setEditing(null);
            setFormErrors([]);
          }}
        />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir OBM"
        message="Tem certeza de que deseja remover esta OBM?"
      />

      <ConfirmationModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        isLoading={clearingAll}
        title="Limpar todas as OBMs"
        message="Todos os registros de OBM serao apagados. Deseja continuar?"
      />
    </MainLayout>
  );
};

export default ObmsSisgpoPage;
