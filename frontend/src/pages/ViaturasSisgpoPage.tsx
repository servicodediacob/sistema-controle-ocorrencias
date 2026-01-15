import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { useNotification } from '../contexts/NotificationContext';
import { getSisgpoViaturasEmpenhadas, sisgpoApi } from '../services/api';
import {
  ApiListResponse,
  Obm,
  SisgpoPagination,
  ValidationError,
  Viatura,
} from '../types/sisgpo';
import Button from '../components/ui/Button';
import Label from '../components/ui/Label';
import Input from '../components/ui/Input';
import Spinner from '../components/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import FileUploadCard from '../components/sisgpo/FileUploadCard';
import ViaturaForm, { ViaturaFormPayload } from '../components/sisgpo/ViaturaForm';

const PAGE_SIZE = 20;

const ViaturasSisgpoPage = () => {
  const { addNotification } = useNotification();
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [pagination, setPagination] = useState<SisgpoPagination | null>(null);
  const [filters, setFilters] = useState<{ prefixo: string }>({ prefixo: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [empenhadasViaturas, setEmpenhadasViaturas] = useState<Set<string>>(new Set());

  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viaturasEtag, setViaturasEtag] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Viatura | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const activeFilters = useMemo(
    () => (filters.prefixo ? { prefixo: filters.prefixo } : {}),
    [filters]
  );

  const fetchViaturas = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await sisgpoApi.get<ApiListResponse<Viatura>>(
        '/admin/viaturas',
        {
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          ...activeFilters,
          '_': Date.now(),
        },
        { raw: true }
      );

      const rawEtag = response.headers?.etag ?? response.headers?.ETag;
      const normalizedEtag =
        Array.isArray(rawEtag) ? rawEtag[0] : typeof rawEtag === 'string' ? rawEtag : null;

      setViaturasEtag(normalizedEtag);
      setViaturas(response.data.data ?? []);
      setPagination(
        response.data.pagination ?? {
          currentPage,
          totalPages: 1,
        }
      );
    } catch (error: any) {
      setViaturasEtag(null);
      const message = error?.response?.data?.message || 'Nao foi possivel carregar as viaturas.';
      addNotification(message, 'error');
    } finally {
      setLoadingList(false);
    }
  }, [activeFilters, addNotification, currentPage]);

  const fetchEmpenhadas = useCallback(
    async (force = false) => {
      try {
        const response = await getSisgpoViaturasEmpenhadas(force);
        const normalized = (response.engagedPrefixes ?? [])
          .map((prefix) => prefix?.trim().toUpperCase())
          .filter((prefix): prefix is string => Boolean(prefix));
        setEmpenhadasViaturas(new Set(normalized));
      } catch (error) {
        if (force) {
          addNotification('Nao foi possivel atualizar o status das viaturas empenhadas.', 'warning');
        }
        setEmpenhadasViaturas(new Set());
        console.error('[SISGPO] Falha ao buscar viaturas empenhadas.', error);
      }
    },
    [addNotification]
  );

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

  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await sisgpoApi.get<{ value?: string }>('/admin/metadata/viaturas_last_upload');
      const value = response?.value;
      if (value) {
        setLastUpload(new Date(value).toLocaleString('pt-BR'));
      } else {
        setLastUpload(null);
      }
    } catch {
      setLastUpload(null);
    }
  }, []);

  const refreshViaturas = useCallback(
    async (options?: { forceEmpenhadas?: boolean }) => {
      await fetchViaturas();
      await fetchEmpenhadas(options?.forceEmpenhadas ?? false);
    },
    [fetchEmpenhadas, fetchViaturas]
  );

  useEffect(() => {
    refreshViaturas({ forceEmpenhadas: true });
  }, [refreshViaturas]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchEmpenhadas(false);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchEmpenhadas]);

  useEffect(() => {
    fetchObms();
    fetchLastUpload();
  }, [fetchObms, fetchLastUpload]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters({ prefixo: event.target.value });
    setCurrentPage(1);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await sisgpoApi.post('/admin/viaturas/upload-csv', formData);
      addNotification('Arquivo enviado com sucesso! A lista sera atualizada em breve.', 'success');

      setTimeout(() => {
        const refreshData = async () => {
          try {
            await refreshViaturas({ forceEmpenhadas: true });
            fetchLastUpload();
          } catch (refreshError: any) {
            const message =
              refreshError?.response?.data?.message || 'Falha ao atualizar a lista de viaturas.';
            addNotification(message, 'error');
          } finally {
            // Garante que o estado de loading seja desativado mesmo se a atualização falhar
            setIsUploading(false);
          }
        };
        refreshData();
      }, 7000);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Falha ao enviar o arquivo.';
      addNotification(message, 'error');
      // Desativa o loading se o upload inicial falhar
      setIsUploading(false);
    }
  };

  const handleSave = async (payload: ViaturaFormPayload) => {
    setSaving(true);
    setFormErrors([]);

    let applyToDuplicates = false;
    let duplicates = 0;

    if (editing?.id && editing.obm && payload.obm && editing.obm !== payload.obm) {
      try {
        const response = await sisgpoApi.get<{ count: number }>('/admin/viaturas/duplicates/count', {
          obm: editing.obm,
          exclude_id: editing.id,
        });
        duplicates = Number(response.count ?? 0);
        if (duplicates > 0) {
          applyToDuplicates = window.confirm(
            `Encontramos ${duplicates} outra(s) viatura(s) com OBM ${editing.obm}. Deseja aplicar a alteracao para todas?`
          );
        }
      } catch {
        addNotification(
          'Nao foi possivel verificar outras viaturas com a mesma OBM. Atualizando apenas esta viatura.',
          'warning'
        );
      }
    }

    try {
      if (payload.id) {
        await sisgpoApi.put(`/admin/viaturas/${payload.id}`, {
          ...payload,
          previous_obm: editing?.obm ?? null,
          applyToDuplicates,
        });
      } else {
        await sisgpoApi.post('/admin/viaturas', payload);
      }
      if (applyToDuplicates && duplicates > 0) {
        addNotification(
          `Viatura salva e ${duplicates} registro(s) adicional(is) atualizado(s).`,
          'success'
        );
      } else {
        addNotification('Viatura salva com sucesso.', 'success');
      }
      setIsFormOpen(false);
      setEditing(null);
      await refreshViaturas({ forceEmpenhadas: true });
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        addNotification('Corrija os erros antes de salvar.', 'error');
      } else {
        const message = error?.response?.data?.message || 'Erro ao salvar a viatura.';
        addNotification(message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await sisgpoApi.delete(`/admin/viaturas/${deleteId}`);
      addNotification('Viatura excluida com sucesso.', 'success');
      await refreshViaturas({ forceEmpenhadas: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao excluir a viatura.';
      addNotification(message, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    if (empenhadasViaturas.size > 0) {
      addNotification('Nao e possivel limpar a tabela enquanto houver viaturas empenhadas.', 'error');
      return;
    }
    if (!viaturasEtag) {
      addNotification(
        'Nao foi possivel identificar a versao atual das viaturas. Atualize a lista antes de limpar.',
        'error'
      );
      setConfirmClear(false);
      return;
    }
    setClearingAll(true);
    try {
      await sisgpoApi.delete('/admin/viaturas/clear-all', {
        headers: {
          'If-Match': viaturasEtag,
        },
      });
      addNotification('Tabela de viaturas limpa com sucesso.', 'success');
      await refreshViaturas({ forceEmpenhadas: true });
      fetchLastUpload();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao limpar a tabela de viaturas.';
      addNotification(message, 'error');
    } finally {
      setClearingAll(false);
      setConfirmClear(false);
    }
  };

  const getViaturaStatus = (viatura: Viatura) => {
    const prefix = (viatura.prefixo || '').toUpperCase();
    if (prefix && empenhadasViaturas.has(prefix)) {
      return {
        label: 'EMPENHADO',
        classes: 'bg-amber-500/20 text-amber-200',
      };
    }
    if (viatura.ativa) {
      return {
        label: 'ATIVA',
        classes: 'bg-green-500/20 text-green-200',
      };
    }
    return {
      label: 'INATIVA',
      classes: 'bg-red-500/20 text-red-200',
    };
  };

  return (
    <MainLayout pageTitle="Viaturas (SISGPO)">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Viaturas</h1>
          <p className="text-sm text-text">Gerencie o cadastro de viaturas direto do SISGPO.</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-1 text-sm font-semibold text-blue-100">
            <span>Total</span>
            <span className="text-lg">{pagination?.totalRecords ?? viaturas.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>Adicionar Viatura</Button>
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            Limpar tabela
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <FileUploadCard
          title="Importar/Atualizar Viaturas"
          description="Envie a planilha oficial exportada pelo SISGPO."
          onUpload={handleUpload}
          isLoading={isUploading}
          lastUploadLabel={lastUpload}
        />

        <div className="rounded-lg border border-border bg-surface p-4">
          <Label htmlFor="prefixo">Filtrar por prefixo</Label>
          <Input
            id="prefixo"
            placeholder="Ex.: ABT-001"
            value={filters.prefixo}
            onChange={handleFilterChange}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface">
          {loadingList ? (
            <div className="py-16">
              <Spinner text="Carregando viaturas..." />
            </div>
          ) : viaturas.length === 0 ? (
            <p className="py-8 text-center text-text">Nenhuma viatura encontrada.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Prefixo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        OBM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text">
                        Cidade
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
                    {viaturas.map((viatura) => {
                      const status = getViaturaStatus(viatura);
                      return (
                        <tr key={viatura.id}>
                          <td className="px-4 py-3 text-sm font-semibold text-text-strong">
                            {viatura.prefixo}
                          </td>
                          <td className="px-4 py-3 text-sm text-text">
                            {viatura.obm_abreviatura || viatura.obm || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-text">{viatura.cidade || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.classes}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="px-3 py-1 text-xs"
                                onClick={() => {
                                  setEditing(viatura);
                                  setIsFormOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                className="px-3 py-1 text-xs"
                                onClick={() => setDeleteId(viatura.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {viaturas.map((viatura) => {
                  const status = getViaturaStatus(viatura);
                  return (
                    <div
                      key={viatura.id}
                      className="rounded-lg border border-border bg-background p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase text-text">Prefixo</p>
                          <p className="text-lg font-semibold text-text-strong">{viatura.prefixo}</p>
                          <p className="text-sm text-text">
                            {viatura.obm_abreviatura || viatura.obm || 'OBM nao informada'}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-text">
                        <p>
                          <span className="font-semibold text-text-strong">Cidade:</span>{' '}
                          {viatura.cidade || 'Nao informado'}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setEditing(viatura);
                            setIsFormOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="flex-1"
                          onClick={() => setDeleteId(viatura.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
        title={editing ? 'Editar viatura' : 'Adicionar viatura'}
      >
        <ViaturaForm
          initialData={editing}
          obms={obms}
          isSaving={saving}
          errors={formErrors}
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
        title="Confirmar exclusao"
        message="Esta acao removera a viatura do SISGPO. Deseja continuar?"
      />

      <ConfirmationModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        isLoading={clearingAll}
        title="Limpar tabela"
        message="Todos os registros de viaturas serao apagados. Essa acao nao pode ser desfeita."
      />
    </MainLayout>
  );
};

export default ViaturasSisgpoPage;
