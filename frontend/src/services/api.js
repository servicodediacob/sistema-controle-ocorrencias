// frontend/src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sistema-ocorrencias-d7rw.onrender.com/api',
} );

// Interceptor para adicionar o token JWT em todas as requisições
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

// --- AUTH ---
export const login = async (email, senha) => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- DADOS DE APOIO ---
export const getObms = async () => {
  const response = await api.get('/obms');
  return response.data;
};

export const getNaturezas = async () => {
  const response = await api.get('/naturezas');
  return response.data;
};

// --- OCORRÊNCIAS (Criação) ---
export const criarOcorrencia = async (payload) => {
  try {
    const response = await api.post('/ocorrencias', payload);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- DASHBOARD (Estatísticas) ---
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- GESTÃO DE OCORRÊNCIAS (CRUD) ---
export const getOcorrencias = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/ocorrencias?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateOcorrencia = async (id, data) => {
  try {
    const response = await api.put(`/ocorrencias/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteOcorrencia = async (id) => {
  try {
    const response = await api.delete(`/ocorrencias/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// ========================================================
// --- NOVA SEÇÃO: USUÁRIOS (CRUD) ---
// ========================================================

/**
 * Busca a lista de todos os usuários.
 */
export const getUsuarios = async () => {
  try {
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Cria um novo usuário.
 * @param {object} data - Os dados do novo usuário ({ nome, email, senha }).
 */
export const criarUsuario = async (data) => {
  try {
    const response = await api.post('/usuarios', data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Atualiza um usuário existente.
 * @param {number} id - O ID do usuário a ser atualizado.
 * @param {object} data - Os novos dados do usuário ({ nome, email }).
 */
export const updateUsuario = async (id, data) => {
  try {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Exclui um usuário.
 * @param {number} id - O ID do usuário a ser excluído.
 */
export const deleteUsuario = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};


// --- GESTÃO DO PLANTÃO ---
export const getPlantao = async () => {
  try {
    const response = await api.get('/plantao');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getSupervisores = async () => {
  try {
    const response = await api.get('/plantao/supervisores');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const setOcorrenciaDestaque = async (ocorrencia_id) => {
  try {
    const response = await api.post('/plantao/destaque', { ocorrencia_id });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const setSupervisorPlantao = async (usuario_id) => {
  try {
    const response = await api.post('/plantao/supervisor', { usuario_id });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
