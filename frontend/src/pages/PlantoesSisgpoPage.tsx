import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Car,
  Edit,
  Plane,
  Shield,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';
import { useNotification } from '../contexts/NotificationContext';
import { sisgpoApi } from '../services/api';
import {
  ActiveTab,
  ApiListResponse,
  EscalaAeronave,
  EscalaCodec,
  EscalaMedico,
  Plantao,
  PlantaoDetalhado,
  SisgpoPagination,
  Viatura,
} from '../types/sisgpo';
import PlantaoForm, { PlantaoFormPayload } from '../components/sisgpo/PlantaoForm';
import EscalaMedicoForm, { EscalaMedicoPayload } from '../components/sisgpo/EscalaMedicoForm';
import EscalaAeronaveForm, { EscalaAeronavePayload } from '../components/sisgpo/EscalaAeronaveForm';
import EscalaCodecForm, { EscalaCodecPayload } from '../components/sisgpo/EscalaCodecForm';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const PLANTOES_PER_PAGE = 15;

interface DeleteTarget {
  id: number;
  type: ActiveTab;
}

const SimplePagination = ({
  pagination,
  onChange,
}: {
  pagination: SisgpoPagination | null;
  onChange: (page: number) => void;
}) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { currentPage, totalPages } = pagination;

  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <Button
        variant="secondary"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-text">
        Pagina {currentPage} de {totalPages}
      </span>
      <Button
        variant="secondary"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Proxima
      </Button>
    </div>
  );
};

const buildFilterParams = (filters: Record<string, string | undefined>) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  );

const PlantoesSisgpoPage = () => {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<ActiveTab>('plantoes');
  const [filters, setFilters] = useState<{ data_inicio: string; data_fim: string }>({
    data_inicio: '',
    data_fim: '',
  });

  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [plantaoPagination, setPlantaoPagination] = useState<SisgpoPagination | null>(null);
  const [currentPlantaoPage, setCurrentPlantaoPage] = useState(1);
  const [isLoadingPlantoes, setIsLoadingPlantoes] = useState(true);
  const [isPlantaoModalOpen, setIsPlantaoModalOpen] = useState(false);
  const [savingPlantao, setSavingPlantao] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);

  const [escalaMedicos, setEscalaMedicos] = useState<EscalaMedico[]>([]);
  const [isLoadingMedicos, setIsLoadingMedicos] = useState(false);
  const [savingEscalaMedico, setSavingEscalaMedico] = useState(false);
  const [isEscalaMedicoModalOpen, setIsEscalaMedicoModalOpen] = useState(false);

  const [escalaAeronaves, setEscalaAeronaves] = useState<EscalaAeronave[]>([]);
  const [isLoadingAeronaves, setIsLoadingAeronaves] = useState(false);
  const [savingAeronave, setSavingAeronave] = useState(false);
  const [isEscalaAeronaveModalOpen, setIsEscalaAeronaveModalOpen] = useState(false);

  const [escalaCodec, setEscalaCodec] = useState<EscalaCodec[]>([]);
  const [isLoadingCodec, setIsLoadingCodec] = useState(false);
  const [savingCodec, setSavingCodec] = useState(false);
  const [isEscalaCodecModalOpen, setIsEscalaCodecModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredParams = useMemo(
    () => buildFilterParams(filters),
    [filters]
  );

  const fetchViaturas = useCallback(async () => {
    const perPage = 200;
    let currentPage = 1;
    const allViaturas: Viatura[] = [];

    try {
      while (true) {
        const response = await sisgpoApi.get<ApiListResponse<Viatura>>('/admin/viaturas', {
          page: String(currentPage),
          limit: String(perPage),
        });

        const pageData = response.data ?? [];
        allViaturas.push(...pageData);

        const pagination = response.pagination;
        const hasMorePages =
          pagination &&
          typeof pagination.totalPages === 'number' &&
          pagination.currentPage < pagination.totalPages;

        if (!hasMorePages && pageData.length < perPage) {
          break;
        }

        if (!hasMorePages && pageData.length === 0) {
          break;
        }

        currentPage += 1;
      }

      setViaturas(
        allViaturas.sort((a, b) => {
          if (!a.prefixo) return -1;
          if (!b.prefixo) return 1;
          return a.prefixo.localeCompare(b.prefixo, 'pt-BR');
        })
      );
    } catch {
      addNotification('Nao foi possivel carregar as viaturas do SISGPO.', 'error');
      setViaturas([]);
    }
  }, [addNotification]);

  const fetchPlantoes = useCallback(async () => {
    setIsLoadingPlantoes(true);
    try {
      const response = await sisgpoApi.get<ApiListResponse<Plantao>>('/admin/plantoes', {
        ...filteredParams,
        page: String(currentPlantaoPage),
        limit: String(PLANTOES_PER_PAGE),
      });
      setPlantoes(response.data ?? []);
      setPlantaoPagination(
        response.pagination ?? {
          currentPage: currentPlantaoPage,
          totalPages: 1,
        }
      );
    } catch {
      addNotification('Nao foi possivel carregar os plantoes.', 'error');
      setPlantoes([]);
      setPlantaoPagination(null);
    } finally {
      setIsLoadingPlantoes(false);
    }
  }, [addNotification, currentPlantaoPage, filteredParams]);

  const fetchEscalaMedicos = useCallback(async () => {
    setIsLoadingMedicos(true);
    try {
      const response = await sisgpoApi.get<ApiListResponse<EscalaMedico>>('/admin/escala-medicos', {
        ...filteredParams,
      });
      setEscalaMedicos(response.data ?? []);
    } catch {
      addNotification('Nao foi possivel carregar a escala de medicos.', 'error');
      setEscalaMedicos([]);
    } finally {
      setIsLoadingMedicos(false);
    }
  }, [addNotification, filteredParams]);

  const fetchEscalaAeronaves = useCallback(async () => {
    setIsLoadingAeronaves(true);
    try {
      const response = await sisgpoApi.get<EscalaAeronave[]>('/admin/escala-aeronaves', {
        ...filteredParams,
      });
      setEscalaAeronaves(Array.isArray(response) ? response : []);
    } catch {
      addNotification('Nao foi possivel carregar a escala de aeronaves.', 'error');
      setEscalaAeronaves([]);
    } finally {
      setIsLoadingAeronaves(false);
    }
  }, [addNotification, filteredParams]);

  const fetchEscalaCodec = useCallback(async () => {
    setIsLoadingCodec(true);
    try {
      const response = await sisgpoApi.get<EscalaCodec[]>('/admin/escala-codec', {
        ...filteredParams,
      });
      setEscalaCodec(Array.isArray(response) ? response : []);
    } catch {
      addNotification('Nao foi possivel carregar a escala do CODEC.', 'error');
      setEscalaCodec([]);
    } finally {
      setIsLoadingCodec(false);
    }
  }, [addNotification, filteredParams]);

  useEffect(() => {
    fetchViaturas();
  }, [fetchViaturas]);

  useEffect(() => {
    switch (activeTab) {
      case 'plantoes':
        fetchPlantoes();
        break;
      case 'escalaMedicos':
        fetchEscalaMedicos();
        break;
      case 'escalaAeronaves':
        fetchEscalaAeronaves();
        break;
      case 'escalaCodec':
        fetchEscalaCodec();
        break;
    }
  }, [activeTab, fetchEscalaAeronaves, fetchEscalaCodec, fetchEscalaMedicos, fetchPlantoes]);

  const openPlantaoModal = () => {
    setPlantaoToEdit(null);
    setIsPlantaoModalOpen(true);
  };

  const handleEditPlantao = async (id: number) => {
    try {
      const response = await sisgpoApi.get<PlantaoDetalhado>(`/admin/plantoes/${id}`);
      setPlantaoToEdit(response);
      setIsPlantaoModalOpen(true);
    } catch {
      addNotification('Nao foi possivel carregar o plantao selecionado.', 'error');
    }
  };

  const handleSavePlantao = async (payload: PlantaoFormPayload) => {
    setSavingPlantao(true);
    try {
      if (payload.id) {
        await sisgpoApi.put(`/admin/plantoes/${payload.id}`, payload);
        addNotification('Plantao atualizado com sucesso.', 'success');
      } else {
        await sisgpoApi.post('/admin/plantoes', payload);
        addNotification('Plantao criado com sucesso.', 'success');
      }
      setIsPlantaoModalOpen(false);
      setPlantaoToEdit(null);
      fetchPlantoes();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Nao foi possivel salvar o plantao no SISGPO.';
      addNotification(message, 'error');
    } finally {
      setSavingPlantao(false);
    }
  };

  const handleSaveEscalaMedico = async (payload: EscalaMedicoPayload) => {
    setSavingEscalaMedico(true);
    try {
      await sisgpoApi.post('/admin/escala-medicos', payload);
      addNotification('Registro incluido na escala de medicos.', 'success');
      setIsEscalaMedicoModalOpen(false);
      fetchEscalaMedicos();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Nao foi possivel salvar a escala de medicos.';
      addNotification(message, 'error');
    } finally {
      setSavingEscalaMedico(false);
    }
  };

  const handleSaveEscalaAeronave = async (payload: EscalaAeronavePayload) => {
    setSavingAeronave(true);
    try {
      await sisgpoApi.post('/admin/escala-aeronaves', payload);
      addNotification('Escala de aeronave registrada com sucesso.', 'success');
      setIsEscalaAeronaveModalOpen(false);
      fetchEscalaAeronaves();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Nao foi possivel salvar a escala de aeronaves.';
      addNotification(message, 'error');
    } finally {
      setSavingAeronave(false);
    }
  };

  const handleSaveEscalaCodec = async (payload: EscalaCodecPayload) => {
    setSavingCodec(true);
    try {
      await sisgpoApi.post('/admin/escala-codec', payload);
      addNotification('Escala do CODEC salva com sucesso.', 'success');
      setIsEscalaCodecModalOpen(false);
      fetchEscalaCodec();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Nao foi possivel salvar a escala do CODEC.';
      addNotification(message, 'error');
    } finally {
      setSavingCodec(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      let path = `/admin/${deleteTarget.type}/${deleteTarget.id}`;
      if (deleteTarget.type === 'escalaAeronaves') {
        path = `/admin/escala-aeronaves/${deleteTarget.id}`;
      } else if (deleteTarget.type === 'escalaMedicos') {
        path = `/admin/escala-medicos/${deleteTarget.id}`;
      } else if (deleteTarget.type === 'escalaCodec') {
        path = `/admin/escala-codec/${deleteTarget.id}`;
      }
      await sisgpoApi.delete(path);
      addNotification('Registro removido com sucesso.', 'success');
      switch (deleteTarget.type) {
        case 'plantoes':
          fetchPlantoes();
          break;
        case 'escalaMedicos':
          fetchEscalaMedicos();
          break;
        case 'escalaAeronaves':
          fetchEscalaAeronaves();
          break;
        case 'escalaCodec':
          fetchEscalaCodec();
          break;
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao excluir o registro.';
      addNotification(message, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleFilterChange = (field: 'data_inicio' | 'data_fim', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPlantaoPage(1);
  };

  const renderTabButton = (
    tab: ActiveTab,
    label: string,
    IconComponent: typeof Car | typeof Stethoscope | typeof Plane | typeof Shield
  ) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        activeTab === tab ? 'bg-blue-600 text-white' : 'bg-surface text-text hover:bg-surface/80'
      }`}
    >
      <IconComponent size={16} />
      <span>{label}</span>
    </button>
  );

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <MainLayout pageTitle="Plantoes (SISGPO)">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Gerenciamento de Escalas</h1>
          <p className="text-sm text-text">
            Gerencie plantoes de viaturas, medicos, pilotos e plantonistas diretamente do SISGPO.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openPlantaoModal} className="flex items-center gap-2">
            <CalendarPlus size={16} /> Lancar Plantao VTR
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setIsEscalaMedicoModalOpen(true)}
          >
            <Stethoscope size={16} /> Escala Medicos
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setIsEscalaAeronaveModalOpen(true)}
          >
            <Plane size={16} /> Escala Pilotos
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setIsEscalaCodecModalOpen(true)}
          >
            <Shield size={16} /> Escala CODEC
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-lg border border-border bg-surface p-4 md:grid-cols-3">
        <div>
          <Label htmlFor="dataInicio">Data Inicio</Label>
          <Input
            id="dataInicio"
            type="date"
            value={filters.data_inicio}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleFilterChange('data_inicio', event.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="dataFim">Data Fim</Label>
          <Input
            id="dataFim"
            type="date"
            value={filters.data_fim}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleFilterChange('data_fim', event.target.value)
            }
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setFilters({ data_inicio: '', data_fim: '' });
              setCurrentPlantaoPage(1);
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          {renderTabButton('plantoes', 'Viaturas', Car)}
          {renderTabButton('escalaMedicos', 'Medicos', Stethoscope)}
          {renderTabButton('escalaAeronaves', 'Aeronaves', Plane)}
          {renderTabButton('escalaCodec', 'Plantoes Sup./Def.', Shield)}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'plantoes' && (
          <div className="rounded-lg border border-border bg-surface">
            {isLoadingPlantoes ? (
              <div className="py-16">
                <Spinner text="Carregando plantoes..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Viatura
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        OBM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Guarnicao
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plantoes.map((plantao) => (
                      <tr key={plantao.id}>
                        <td className="px-4 py-3 text-sm text-text">{formatDate(plantao.data_plantao)}</td>
                        <td className="px-4 py-3 text-sm text-text-strong">{plantao.viatura_prefixo}</td>
                        <td className="px-4 py-3 text-sm text-text">{plantao.obm_abreviatura}</td>
                        <td className="px-4 py-3 text-sm text-text">
                          <ul className="space-y-1">
                            {plantao.guarnicao?.map((membro, index) => (
                              <li key={`${plantao.id}-${index}`}>
                                <span className="font-medium">{membro.nome_exibicao}</span>
                                {membro.funcao && <span className="text-xs text-text"> - {membro.funcao}</span>}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                              onClick={() => handleEditPlantao(plantao.id)}
                            >
                              <Edit size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500"
                              onClick={() => setDeleteTarget({ id: plantao.id, type: 'plantoes' })}
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <SimplePagination pagination={plantaoPagination} onChange={setCurrentPlantaoPage} />
          </div>
        )}

        {activeTab === 'escalaMedicos' && (
          <div className="rounded-lg border border-border bg-surface">
            {isLoadingMedicos ? (
              <div className="py-12">
                <Spinner text="Carregando escala de medicos..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Entrada
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Saida
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {escalaMedicos.map((registro) => (
                      <tr key={registro.id}>
                        <td className="px-4 py-3 text-sm text-text-strong">{registro.nome_completo}</td>
                        <td className="px-4 py-3 text-sm text-text">{formatDateTime(registro.entrada_servico)}</td>
                        <td className="px-4 py-3 text-sm text-text">{formatDateTime(registro.saida_servico)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              registro.status_servico === 'Presente'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-200'
                            }`}
                          >
                            {registro.status_servico}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-400 hover:text-red-300"
                            onClick={() => setDeleteTarget({ id: registro.id, type: 'escalaMedicos' })}
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaAeronaves' && (
          <div className="rounded-lg border border-border bg-surface">
            {isLoadingAeronaves ? (
              <div className="py-12">
                <Spinner text="Carregando escala de aeronaves..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Aeronave
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        1o Piloto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        2o Piloto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {escalaAeronaves.map((registro) => (
                      <tr key={registro.id}>
                        <td className="px-4 py-3 text-sm text-text">{formatDate(registro.data)}</td>
                        <td className="px-4 py-3 text-sm text-text-strong">{registro.aeronave_prefixo}</td>
                        <td className="px-4 py-3 text-sm text-text">{registro.primeiro_piloto}</td>
                        <td className="px-4 py-3 text-sm text-text">{registro.segundo_piloto}</td>
                        <td className="px-4 py-3 text-sm text-text">{registro.status}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-400 hover:text-red-300"
                            onClick={() =>
                              setDeleteTarget({ id: registro.id, type: 'escalaAeronaves' })
                            }
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaCodec' && (
          <div className="rounded-lg border border-border bg-surface">
            {isLoadingCodec ? (
              <div className="py-12">
                <Spinner text="Carregando escala do CODEC..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Turno
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Plantonista
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-text">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {escalaCodec.map((registro) => (
                      <tr key={registro.id}>
                        <td className="px-4 py-3 text-sm text-text">{formatDate(registro.data)}</td>
                        <td className="px-4 py-3 text-sm text-text">{registro.turno}</td>
                        <td className="px-4 py-3 text-sm text-text">
                          Plantonista {registro.ordem_plantonista}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-strong">{registro.nome_plantonista}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-400 hover:text-red-300"
                            onClick={() => setDeleteTarget({ id: registro.id, type: 'escalaCodec' })}
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isPlantaoModalOpen}
        onClose={() => {
          setIsPlantaoModalOpen(false);
          setPlantaoToEdit(null);
        }}
        title={plantaoToEdit ? 'Editar plantao' : 'Lancar plantao de viatura'}
      >
        <PlantaoForm
          viaturas={viaturas}
          initialData={plantaoToEdit}
          onSave={handleSavePlantao}
          onCancel={() => {
            setIsPlantaoModalOpen(false);
            setPlantaoToEdit(null);
          }}
          isSaving={savingPlantao}
        />
      </Modal>

      <Modal
        isOpen={isEscalaMedicoModalOpen}
        onClose={() => setIsEscalaMedicoModalOpen(false)}
        title="Adicionar registro na escala de medicos"
      >
        <EscalaMedicoForm
          isSaving={savingEscalaMedico}
          onSave={handleSaveEscalaMedico}
          onCancel={() => setIsEscalaMedicoModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEscalaAeronaveModalOpen}
        onClose={() => setIsEscalaAeronaveModalOpen(false)}
        title="Lancar escala de aeronave"
      >
        <EscalaAeronaveForm
          isSaving={savingAeronave}
          onSave={handleSaveEscalaAeronave}
          onCancel={() => setIsEscalaAeronaveModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEscalaCodecModalOpen}
        onClose={() => setIsEscalaCodecModalOpen(false)}
        title="Lancar escala do CODEC"
      >
        <EscalaCodecForm
          isSaving={savingCodec}
          onSave={handleSaveEscalaCodec}
          onCancel={() => setIsEscalaCodecModalOpen(false)}
        />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Confirmar exclusao"
        message="Tem certeza de que deseja excluir este registro? Esta acao nao pode ser desfeita."
      />
    </MainLayout>
  );
};

export default PlantoesSisgpoPage;
