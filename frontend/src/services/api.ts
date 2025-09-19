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
  descricao?: string;
}

export interface IUnidade {
  id: number;
  cidade_nome: string;
  crbm_id: number;
  crbm_nome: string;
}

export interface ICrbm {
  id: number;
  nome: string;
}

export interface ICidade {
  id: number;
  cidade_nome: string;
  crbm_id: number;
  crbm_nome: string;
}

export interface IOcorrenciaPayload {
  ocorrencia: {
    cidade_id: number;
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
  cidade_id: number;
  natureza_descricao: string;
  cidade_nome: string;
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
    cidade_nome: string | null;
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
  "1º CRBM": string;
  "2º CRBM": string;
  "3º CRBM": string;
  "4º CRBM": string;
  "5º CRBM": string;
  "6º CRBM": string;
  "7º CRBM": string;
  "8º CRBM": string;
  "9º CRBM": string;
  total_geral: string;
}

export interface IEstatisticaLotePayload {
  data_registro: string;
  cidade_id: number;
  estatisticas: {
    natureza_id: number;
    quantidade: number;
  }[];
}

export interface IObitoRegistro {
  id: number;
  data_ocorrencia: string;
  natureza_id: number;
  natureza_nome: string;
  numero_ocorrencia: string;
  obm_responsavel: string;
  quantidade_vitimas: number;
}

export interface IObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_responsavel: string;
  quantidade_vitimas: number;
}

interface ApiError {
  message: string;
}

// ===============================================
// --- Configuração do Axios ---
// ===============================================

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
console.log(`[INFO] A API está se comunicando com: ${baseURL}`  );

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.message || `Request failed with status code ${axiosError.response?.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro desconhecido.';
};

// ===============================================
// --- Funções da API Tipadas ---
// ===============================================

export const login = async (email: string, senha: string): Promise<{ usuario: IUser; token: string }> => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// --- Funções para Unidades (Cidades) e CRBMs ---
export const getUnidades = async (): Promise<IUnidade[]> => api.get('/unidades').then(res => res.data);
export const createUnidade = async (data: { crbm_id: number; cidade_nome: string; }): Promise<IUnidade> => api.post('/unidades', data).then(res => res.data);
export const updateUnidade = async (id: number, data: { crbm_id: number; cidade_nome: string; }): Promise<IUnidade> => api.put(`/unidades/${id}`, data).then(res => res.data);
export const deleteUnidade = async (id: number): Promise<{ message: string }> => api.delete(`/unidades/${id}`).then(res => res.data);
export const getCrbms = async (): Promise<ICrbm[]> => api.get('/crbms').then(res => res.data);
export const getCidades = async (): Promise<ICidade[]> => api.get('/unidades').then(res => res.data);

// --- Funções de Naturezas ---
export const getNaturezas = async (): Promise<IDataApoio[]> => api.get('/naturezas').then(res => res.data);

export const getNaturezasPorNomes = async (nomes: string[]): Promise<IDataApoio[]> => {
  try {
    const response = await api.post('/naturezas/por-nomes', { nomes });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const createNatureza = async (data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => api.post('/naturezas', data).then(res => res.data);
export const updateNatureza = async (id: number, data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => api.put(`/naturezas/${id}`, data).then(res => res.data);
export const deleteNatureza = async (id: number): Promise<{ message: string }> => api.delete(`/naturezas/${id}`).then(res => res.data);

// --- Funções de Ocorrências ---
export const criarOcorrencia = async (payload: IOcorrenciaPayload): Promise<{ message: string; ocorrenciaId: number }> => {
  try {
    const response = await api.post('/ocorrencias', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getOcorrencias = async (page = 1, limit = 10): Promise<IPaginatedOcorrencias> => {
  try {
    const response = await api.get(`/ocorrencias?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const updateOcorrencia = async (id: number, data: { data_ocorrencia: string; natureza_id: number; cidade_id: number; }): Promise<{ message: string; ocorrencia: IOcorrencia }> => {
  try {
    const response = await api.put(`/ocorrencias/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteOcorrencia = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/ocorrencias/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// --- Funções de Dashboard, Usuários, Plantão ---
export const getDashboardStats = async (): Promise<IDashboardStats> => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getUsuarios = async (): Promise<IUser[]> => {
  try {
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const criarUsuario = async (data: Omit<IUser, 'id'> & { senha?: string }): Promise<{ message: string; usuario: IUser }> => {
  try {
    const response = await api.post('/usuarios', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const updateUsuario = async (id: number, data: Partial<IUser>): Promise<{ message: string; usuario: IUser }> => {
  try {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteUsuario = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getPlantao = async (): Promise<IPlantao> => {
  try {
    const response = await api.get('/plantao');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getSupervisores = async (): Promise<ISupervisor[]> => {
  try {
    const response = await api.get('/plantao/supervisores');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const setOcorrenciaDestaque = async (ocorrencia_id: number | null): Promise<any> => {
  try {
    const response = await api.post('/plantao/destaque', { ocorrencia_id });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const setSupervisorPlantao = async (usuario_id: number | null): Promise<any> => {
  try {
    const response = await api.post('/plantao/supervisor', { usuario_id });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// --- Funções para Estatísticas e Relatórios ---

export const registrarEstatisticasLote = async (payload: IEstatisticaLotePayload): Promise<{ message: string }> => {
  try {
    const response = await api.post('/estatisticas/lote', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getRelatorio = async (data_inicio: string, data_fim: string): Promise<IRelatorioRow[]> => {
  try {
    const response = await api.get('/relatorio', { params: { data_inicio, data_fim } });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// --- Funções para o CRUD de Registros de Óbitos ---

export const getObitosPorData = async (data: string): Promise<IObitoRegistro[]> => {
  try {
    const response = await api.get('/obitos-registros', { params: { data } });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const criarObitoRegistro = async (payload: IObitoRegistroPayload): Promise<IObitoRegistro> => {
  try {
    const response = await api.post('/obitos-registros', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteObitoRegistro = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/obitos-registros/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
