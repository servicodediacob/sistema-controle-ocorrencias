import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { useNotification } from '../contexts/NotificationContext';
import { sisgpoApi } from '../services/api';
import {
  ApiListResponse,
  Militar,
  Obm,
  SisgpoPagination,
  ValidationError,
} from '../types/sisgpo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import FileUploadCard from '../components/sisgpo/FileUploadCard';
import MilitarForm, { MilitarFormPayload } from '../components/sisgpo/MilitarForm';

const PAGE_SIZE = 20;

const MilitaresSisgpoPage = () => {
  const { addNotification } = useNotification();
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [filters, setFilters] = useState<{ termo: string }>({ termo: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SisgpoPagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Militar | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const activeFilters = useMemo(
    () => (filters.termo ? { nome_completo: filters.termo } : {}),
    [filters]
  );

  const fetchMilitares = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sisgpoApi.get<ApiListResponse<Militar>>('/admin/militares', {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        ...activeFilters,
        '_': Date.now(),
      });
      setMilitares(response.data ?? []);
      setPagination(
        response.pagination ?? {
          currentPage,
          totalPages: 1,
        }
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Nao foi possivel carregar os militares.';
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, addNotification, currentPage]);

  const fetchObms = useCallback(async () => {
    try {
      const response = await sisgpoApi.get<ApiListResponse<Obm>>('/admin/obms', {
        limit: '500',
      });
      setObms(response.data ?? []);
    } catch {
      setObms([]);
    }
  }, []);

  useEffect(() => {
    fetchMilitares();
  }, [fetchMilitares]);

  useEffect(() => {
    fetchObms();
  }, [fetchObms]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('search') as HTMLInputElement | null;
    setFilters({ termo: input?.value ?? '' });
    setCurrentPage(1);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await sisgpoApi.post('/admin/militares/upload-csv', formData);
      addNotification('Arquivo enviado com sucesso.', 'success');
      fetchMilitares();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao enviar o arquivo.';
      addNotification(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (payload: MilitarFormPayload) => {
    setIsSaving(true);
    setFormErrors([]);
    try {
      if (payload.id) {
        await sisgpoApi.put(`/admin/militares/${payload.id}`, payload);
      } else {
        await sisgpoApi.post('/admin/militares', payload);
      }
      addNotification('Registro salvo com sucesso.', 'success');
      setIsFormOpen(false);
      setEditing(null);
      fetchMilitares();
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
      const message = error?.response?.data?.message || 'Nao foi possivel salvar o registro.';
      addNotification(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await sisgpoApi.delete(`/admin/militares/${deleteId}`);
      addNotification('Militar removido com sucesso.', 'success');
      fetchMilitares();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao remover o militar.';
      addNotification(message, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout pageTitle="Militares (SISGPO)">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Efetivo</h1>
          <p className="text-sm text-text">
            Busque e atualize os militares cadastrados diretamente no SISGPO.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-1 text-sm font-semibold text-blue-100">
            <span>Total</span>
            <span className="text-lg">{pagination?.totalRecords ?? militares.length}</span>
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
            Adicionar militar
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <FileUploadCard
          title="Importar/Atualizar militares"
          description="Envie o arquivo CSV exportado pelo SISGPO."
          onUpload={handleUpload}
          isLoading={isUploading}
        />

        <form onSubmit={handleSearch} className="rounded-lg border border-border bg-surface p-4">
          <Label htmlFor="search">Buscar por nome, matricula ou posto</Label>
          <Input
            id="search"
            name="search"
            placeholder="Digite para filtrar"
            defaultValue={filters.termo}
            onChange={(event) => setFilters({ termo: event.target.value })}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters({ termo: '' });
                setCurrentPage(1);
                fetchMilitares();
              }}
            >
              Limpar
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-border bg-surface">
          {loading ? (
            <div className="py-16">
              <Spinner text="Carregando militares..." />
            </div>
          ) : militares.length === 0 ? (
            <p className="py-8 text-center text-text">Nenhum registro encontrado.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Posto/Grad.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Nome completo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Nome de guerra
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Matricula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        OBM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Telefone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {militares.map((militar) => (
                      <tr key={militar.id}>
                        <td className="px-4 py-3 text-sm text-text-strong">{militar.posto_graduacao}</td>
                        <td className="px-4 py-3 text-sm text-text">{militar.nome_completo}</td>
                        <td className="px-4 py-3 text-sm text-text">{militar.nome_guerra || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-text">{militar.matricula}</td>
                        <td className="px-4 py-3 text-sm text-text">{militar.obm_nome || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-text">{militar.telefone || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${militar.ativo ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                              }`}
                          >
                            {militar.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-1 text-xs"
                              onClick={() => {
                                setEditing(militar);
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
                              onClick={() => setDeleteId(militar.id)}
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
                {militares.map((militar) => (
                  <div
                    key={militar.id}
                    className="rounded-lg border border-border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-text">Posto/Grad.</p>
                        <p className="text-base font-semibold text-text-strong">
                          {militar.posto_graduacao}
                        </p>
                        <p className="text-sm text-text">{militar.nome_completo}</p>
                        {militar.nome_guerra && (
                          <p className="text-xs text-text">({militar.nome_guerra})</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${militar.ativo ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                          }`}
                      >
                        {militar.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-text">
                      <p>
                        <span className="font-semibold text-text-strong">Matricula:</span>{' '}
                        {militar.matricula}
                      </p>
                      <p>
                        <span className="font-semibold text-text-strong">OBM:</span>{' '}
                        {militar.obm_nome || 'Nao informado'}
                      </p>
                      <p>
                        <span className="font-semibold text-text-strong">Telefone:</span>{' '}
                        {militar.telefone || 'Nao informado'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setEditing(militar);
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
                        onClick={() => setDeleteId(militar.id)}
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
        title={editing ? 'Editar militar' : 'Adicionar militar'}
      >
        <MilitarForm
          initialData={editing}
          obms={obms}
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
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir militar"
        message="Deseja realmente excluir este registro do SISGPO?"
      />
    </MainLayout>
  );
};

export default MilitaresSisgpoPage;
