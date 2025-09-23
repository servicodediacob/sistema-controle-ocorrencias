import axios, { AxiosError } from 'axios';
import { IUser } from '../contexts/AuthContext';

// ===============================================
// --- Interfaces de Tipos da API ---
// ===============================================

export type { IUser };

export interface IDataApoio {
  id: number;
  nome?: string;
  grupo?: string;
  subgrupo?: string;
  abreviacao?: string | null;
  descricao?: string;
}

// CORREÇÃO: A API retorna 'cidade_nome' para OBMs.
export interface IObm {
  id: number;
  cidade_nome: string; // A API retorna este campo para o nome da OBM/Unidade
  crbm_id: number;
  crbm_nome: string;
}

export type ICidade = IObm;

export interface ICrbm {
  id: number;
  nome: string;
}

export interface IOcorrenciaPayload {
  ocorrencia: {
    obm_id: number;
    natureza_id: number;
    data_ocorrencia: string;
  };
  obitos?: {
    nome_vitima: string;
    idade_vitima: number;
    genero: string;
  }[];
}

export interface IOcorrencia {
  id: number;
  data_ocorrencia: string;
  quantidade_obitos: number;
  natureza_id: number;
  obm_id: number;
  natureza_descricao: string;
  obm_nome: string; // CORREÇÃO: Adicionado para consistência com a resposta da API
  crbm_nome: string;
}

export interface IPaginatedOcorrencias {
  ocorrencias: IOcorrencia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IDashboardStats {
  totalOcorrencias: number;
  totalObitos: number;
  ocorrenciasPorNatureza: { nome: string; total: number }[];
  ocorrenciasPorCrbm: { nome: string; total: number }[];
}

export interface IPlantao {
  ocorrenciaDestaque: {
    ocorrencia_id: number | null;
    data_ocorrencia: string | null;
    natureza_descricao: string | null;
    obm_nome: string | null;
    crbm_nome: string | null;
  } | null;
  supervisorPlantao: {
    usuario_id: number | null;
    supervisor_nome: string | null;
  } | null;
}

export interface ISupervisor {
  id: number;
  nome: string;
}

export interface IRelatorioRow {
  grupo: string;
  subgrupo: string;
  diurno: string;
  noturno: string;
  total_capital: string;
  "1º CRBM": string; "2º CRBM": string; "3º CRBM": string;
  "4º CRBM": string; "5º CRBM": string; "6º CRBM": string;
  "7º CRBM": string; "8º CRBM": string; "9º CRBM": string;
  total_geral: string;
}

export interface IEstatisticaLotePayload {
  data_registro: string;
  obm_id: number;
  estatisticas: {
    natureza_id: number;
    quantidade: number;
  }[];
}

export interface IEstatisticaAgrupada {
  crbm_nome: string;
  cidade_nome: string;
  natureza_nome: string;
  natureza_abreviacao: string | null;
  quantidade: number;
}

export interface IObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_id: number;
  quantidade_vitimas: number;
}

export interface IObitoRegistro {
  id: number;
  data_ocorrencia: string;
  natureza_id: number;
  natureza_nome: string;
  numero_ocorrencia: string;
  obm_id: number;
  obm_nome: string;
  quantidade_vitimas: number;
}

export interface ISolicitacaoAcessoPayload {
  nome: string;
  email: string;
  senha: string;
  obm_id: number;
}

export interface ISolicitacao {
  id: number;
  nome: string;
  email: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  data_solicitacao: string;
  obm_nome: string;
}

interface ApiError {
  message: string;
}

// ===============================================
// --- Configuração do Axios ---
// ===============================================

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
console.log(`[INFO] A API está se comunicando com: ${baseURL}`  );

const api = axios.create({ baseURL });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.message || `Request failed with status code ${axiosError.response?.status}`;
  }
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro desconhecido.';
};

// ===============================================
// --- Funções da API Tipadas ---
// ===============================================

// Auth & Acesso
export const login = async (email: string, senha: string): Promise<{ usuario: IUser; token: string }> => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const solicitarAcesso = async (payload: ISolicitacaoAcessoPayload): Promise<{ message: string }> => {
  try {
    const response = await api.post('/acesso/solicitar', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getSolicitacoes = async (): Promise<ISolicitacao[]> => {
  try {
    const response = await api.get('/acesso');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const gerenciarSolicitacao = async (id: number, acao: 'aprovar' | 'recusar'): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/acesso/${id}/gerenciar`, { acao });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Dados de Apoio
export const getCrbms = async (): Promise<ICrbm[]> => api.get('/crbms').then(res => res.data);
export const getCidades = async (): Promise<ICidade[]> => api.get('/unidades').then(res => res.data);
export const getNaturezas = async (): Promise<IDataApoio[]> => api.get('/naturezas').then(res => res.data);
export const getNaturezasPorNomes = async (nomes: string[]): Promise<IDataApoio[]> => api.post('/naturezas/por-nomes', { nomes }).then(res => res.data);

// Ocorrências
export const criarOcorrencia = async (payload: IOcorrenciaPayload): Promise<{ message: string; ocorrenciaId: number }> => api.post('/ocorrencias', payload).then(res => res.data);
export const getOcorrencias = async (page = 1, limit = 10): Promise<IPaginatedOcorrencias> => api.get(`/ocorrencias?page=${page}&limit=${limit}`).then(res => res.data);
export const updateOcorrencia = async (id: number, data: { data_ocorrencia: string; natureza_id: number; obm_id: number; }): Promise<{ message: string; ocorrencia: IOcorrencia }> => api.put(`/ocorrencias/${id}`, data).then(res => res.data);
export const deleteOcorrencia = async (id: number): Promise<{ message: string }> => api.delete(`/ocorrencias/${id}`).then(res => res.data);

// Dashboard e Plantão
export const getDashboardStats = async (): Promise<IDashboardStats> => api.get('/dashboard/stats').then(res => res.data);
export const getPlantao = async (): Promise<IPlantao> => api.get('/plantao').then(res => res.data);
export const getSupervisores = async (): Promise<ISupervisor[]> => api.get('/plantao/supervisores').then(res => res.data);
export const setOcorrenciaDestaque = async (ocorrencia_id: number | null): Promise<any> => api.post('/plantao/destaque', { ocorrencia_id }).then(res => res.data);
export const setSupervisorPlantao = async (usuario_id: number | null): Promise<any> => api.post('/plantao/supervisor', { usuario_id }).then(res => res.data);

// Usuários
export const getUsuarios = async (): Promise<IUser[]> => api.get('/usuarios').then(res => res.data);
export const criarUsuario = async (data: Omit<IUser, 'id'> & { senha?: string }): Promise<{ message: string; usuario: IUser }> => api.post('/usuarios', data).then(res => res.data);
export const updateUsuario = async (id: number, data: Partial<IUser>): Promise<{ message: string; usuario: IUser }> => api.put(`/usuarios/${id}`, data).then(res => res.data);
export const deleteUsuario = async (id: number): Promise<{ message: string }> => api.delete(`/usuarios/${id}`).then(res => res.data);

// Lançamentos em Lote (Estatísticas)
export const registrarEstatisticasLote = async (payload: IEstatisticaLotePayload): Promise<{ message: string }> => api.post('/estatisticas/lote', payload).then(res => res.data);
export const getEstatisticasAgrupadasPorData = async (data: string): Promise<IEstatisticaAgrupada[]> => api.get('/estatisticas/por-data', { params: { data } }).then(res => res.data);
export const limparEstatisticasDoDia = async (data: string, obm_id?: number): Promise<{ message: string }> => {
  const params: { data: string; obm_id?: number } = { data };
  if (obm_id) params.obm_id = obm_id;
  return api.delete('/estatisticas/por-data', { params }).then(res => res.data);
};

// Relatórios
export const getRelatorio = async (data_inicio: string, data_fim: string): Promise<IRelatorioRow[]> => api.get('/relatorio', { params: { data_inicio, data_fim } }).then(res => res.data);

// Registros de Óbitos
export const getObitosPorData = async (data: string): Promise<IObitoRegistro[]> => api.get('/obitos-registros', { params: { data } }).then(res => res.data);
export const criarObitoRegistro = async (payload: IObitoRegistroPayload): Promise<IObitoRegistro> => api.post('/obitos-registros', payload).then(res => res.data);
export const atualizarObitoRegistro = async (id: number, payload: IObitoRegistroPayload): Promise<IObitoRegistro> => api.put(`/obitos-registros/${id}`, payload).then(res => res.data);
export const deletarObitoRegistro = async (id: number): Promise<{ message: string }> => api.delete(`/obitos-registros/${id}`).then(res => res.data);
export const limparRegistrosDoDia = async (data: string): Promise<{ message: string }> => api.delete('/obitos-registros', { params: { data } }).then(res => res.data);

// ===================================================================
// --- ADIÇÃO: Funções para Gerenciar Dados de Apoio (OBMs e Naturezas) ---
// ===================================================================

// OBMs (Unidades)
export const createUnidade = async (data: { nome: string; crbm_id: number }): Promise<IObm> => 
  api.post('/unidades', data).then(res => res.data);

export const updateUnidade = async (id: number, data: { nome: string; crbm_id: number }): Promise<IObm> => 
  api.put(`/unidades/${id}`, data).then(res => res.data);

export const deleteUnidade = async (id: number): Promise<{ message: string }> => 
  api.delete(`/unidades/${id}`).then(res => res.data);

// Naturezas
export const createNatureza = async (data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => 
  api.post('/naturezas', data).then(res => res.data);

export const updateNatureza = async (id: number, data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => 
  api.put(`/naturezas/${id}`, data).then(res => res.data);

export const deleteNatureza = async (id: number): Promise<{ message: string }> => 
  api.delete(`/naturezas/${id}`).then(res => res.data);
