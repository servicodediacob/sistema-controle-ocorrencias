// frontend/src/services/api.ts

import axios, { AxiosError } from 'axios';
import { IUser } from '../contexts/AuthContext'; // Importa o tipo diretamente

// ===============================================
// --- Interfaces de Tipos da API ---
// ===============================================

export type { IUser }; // Re-exporta o tipo para outros arquivos usarem

export interface IDataApoio {
  id: number;
  nome?: string;
  descricao?: string;
  crbm_id?: number;
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
  obm_nome: string;
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
  ocorrenciasPorOBM: { nome: string; total: number }[];
}

export interface IPlantao {
  ocorrenciaDestaque: {
    ocorrencia_id: number | null;
    data_ocorrencia: string | null;
    natureza_descricao: string | null;
    obm_nome: string | null;
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

interface ApiError {
  message: string;
}

// ===============================================
// --- Configuração do Axios ---
// ===============================================

const api = axios.create({
  baseURL: 'https://sistema-ocorrencias-d7rw.onrender.com/api',
} );

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
    return axiosError.response?.data?.message || 'Ocorreu um erro inesperado na comunicação com a API.';
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

export const getObms = async (): Promise<IDataApoio[]> => api.get('/obms').then(res => res.data);
export const createObm = async (data: { nome: string; crbm_id: number }): Promise<IDataApoio> => api.post('/obms', data).then(res => res.data);
export const updateObm = async (id: number, data: { nome: string; crbm_id: number }): Promise<IDataApoio> => api.put(`/obms/${id}`, data).then(res => res.data);
export const deleteObm = async (id: number): Promise<{ message: string }> => api.delete(`/obms/${id}`).then(res => res.data);

export const getNaturezas = async (): Promise<IDataApoio[]> => api.get('/naturezas').then(res => res.data);
export const createNatureza = async (data: { descricao: string }): Promise<IDataApoio> => api.post('/naturezas', data).then(res => res.data);
export const updateNatureza = async (id: number, data: { descricao: string }): Promise<IDataApoio> => api.put(`/naturezas/${id}`, data).then(res => res.data);
export const deleteNatureza = async (id: number): Promise<{ message: string }> => api.delete(`/naturezas/${id}`).then(res => res.data);

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

export const updateOcorrencia = async (id: number, data: { data_ocorrencia: string; natureza_id: number; obm_id: number }): Promise<{ message: string; ocorrencia: IOcorrencia }> => {
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
