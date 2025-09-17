import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
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

/**
 * Busca uma lista paginada de ocorrências.
 * @param {number} page - O número da página a ser buscada.
 * @param {number} limit - O número de itens por página.
 */
export const getOcorrencias = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/ocorrencias?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Atualiza uma ocorrência existente.
 * @param {number} id - O ID da ocorrência a ser atualizada.
 * @param {object} data - Os novos dados da ocorrência ({ data_ocorrencia, natureza_id, obm_id }).
 */
export const updateOcorrencia = async (id, data) => {
  try {
    const response = await api.put(`/ocorrencias/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Exclui uma ocorrência.
 * @param {number} id - O ID da ocorrência a ser excluída.
 */
export const deleteOcorrencia = async (id) => {
  try {
    const response = await api.delete(`/ocorrencias/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- GESTÃO DO PLANTÃO ---

/**
 * Busca os dados atuais do plantão (destaque e supervisor).
 */
export const getPlantao = async () => {
  try {
    const response = await api.get('/plantao');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Busca la lista de todos os supervisores (usuários).
 */
export const getSupervisores = async () => {
  try {
    const response = await api.get('/plantao/supervisores');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Define a ocorrência de destaque.
 * @param {number | null} ocorrencia_id - O ID da ocorrência ou null para limpar.
 */
export const setOcorrenciaDestaque = async (ocorrencia_id) => {
  try {
    const response = await api.post('/plantao/destaque', { ocorrencia_id });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * Define o supervisor de plantão.
 * @param {number | null} usuario_id - O ID do usuário ou null para limpar.
 */
export const setSupervisorPlantao = async (usuario_id) => {
  try {
    const response = await api.post('/plantao/supervisor', { usuario_id });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
