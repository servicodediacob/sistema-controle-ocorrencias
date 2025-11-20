// Caminho: frontend/src/services/api.ts

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// --- INTERFACES (sem alterações) ---
export interface IUser { id: number; nome: string; email: string; perfil: 'admin' | 'supervisor' | 'user'; role?: 'admin' | 'supervisor' | 'user'; obm_id: number | null; obm_nome?: string; }
export interface IDataApoio { id: number; nome?: string; grupo?: string; subgrupo?: string; abreviacao?: string | null; descricao?: string; }
export interface IObm { id: number; cidade_nome: string; crbm_id: number; crbm_nome: string; }
export type ICidade = IObm;
export interface ICrbm { id: number; nome: string; }
export interface IOcorrenciaPayload { ocorrencia: { obm_id: number; natureza_id: number; data_ocorrencia: string; }; obitos?: { nome_vitima: string; idade_vitima: number; genero: string; }[]; }
export interface IOcorrencia { id: number; data_ocorrencia: string; quantidade_obitos: number; natureza_id: number; obm_id: number; natureza_descricao: string; obm_nome: string; crbm_nome: string; }
export interface IPaginatedOcorrencias { ocorrencias: IOcorrencia[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; }
export interface IDashboardStats { totalOcorrencias: number; totalObitos: number; ocorrenciasPorNatureza: { nome: string; total: number }[]; ocorrenciasPorCrbm: { nome: string; total: number }[]; }
export interface IOcorrenciaDetalhada { id: number; numero_ocorrencia?: string; natureza_id: number; natureza_grupo: string; natureza_nome: string; endereco?: string; bairro?: string; cidade_id: number; cidade_nome: string; viaturas?: string; veiculos_envolvidos?: string; dados_vitimas?: string; resumo_ocorrencia: string; data_ocorrencia: string; horario_ocorrencia?: string; usuario_id: number; }

// Ocorrência de destaque retornada pelo endpoint de relatório completo.
// Inclui os campos detalhados e alguns auxiliares que a API adiciona (ex.: crbm_nome).
export interface IDestaqueRelatorio extends IOcorrenciaDetalhada {
  natureza_descricao?: string;
  obm_nome?: string;
  crbm_nome?: string;
  natureza?: { grupo: string; subgrupo: string };
}
export interface IPlantao { ocorrenciasDestaque: IOcorrenciaDetalhada[]; supervisorPlantao: { usuario_id: number | null; supervisor_nome: string | null; } | null; }
export interface ISupervisor { id: number; nome: string; }
export interface IRelatorioRow { grupo: string; subgrupo: string; diurno: string; noturno: string; total_capital: string; "1º CRBM": string; "2º CRBM": string; "3º CRBM": string; "4º CRBM": string; "5º CRBM": string; "6º CRBM": string; "7º CRBM": string; "8º CRBM": string; "9º CRBM": string; total_geral: string; }
export interface IRelatorioCompleto { estatisticas: IRelatorioRow[]; obitos: IObitoRegistro[]; destaques: IDestaqueRelatorio[]; }
export interface IEstatisticaLotePayload { data_registro: string; obm_id: number; estatisticas: { natureza_id: number; quantidade: number; }[]; }
export interface IEstatisticaAgrupada { crbm_nome: string; cidade_nome: string; natureza_id?: number; natureza_grupo?: string; natureza_nome: string; natureza_abreviacao: string | null; quantidade: number; }
export interface IObitoRegistroPayload { data_ocorrencia: string; natureza_id: number; numero_ocorrencia: string; obm_id: number; quantidade_vitimas: number; }
export interface IObitoRegistro { id: number; data_ocorrencia: string; natureza_id: number; natureza_nome: string; numero_ocorrencia: string; obm_id: number; obm_nome: string; quantidade_vitimas: number; }
export interface ISolicitacaoAcessoPayload { nome: string; email: string; senha: string; obm_id: number; }
export interface ISolicitacao { id: number; nome: string; email: string; status: 'pendente' | 'aprovado' | 'recusado'; data_solicitacao: string; obm_nome: string; }
export interface IAuditoriaLog {
  id: number;
  usuario_nome: string;
  obm_nome: string | null;
  acao: string;
  detalhes: Record<string, any> | string | null;
  criado_em: string;
}
export interface IPaginatedAuditoriaLogs { logs: IAuditoriaLog[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; }
export interface ISisgpoEmpenhoResponse {
  engagedPrefixes: string[];
  fetchedAt?: string;
  cached?: boolean;
}

// New interface for PendingObm
export interface IPendingObm {
  id: number;
  cidade_nome: string;
  crbm_nome: string;
}
interface ApiError { message: string; }

// --- Configuração do Axios (sem alterações) ---
// Constr�i a baseURL de forma robusta a partir da vari�vel de ambiente
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/';
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/$/, '')}/api`;
export const api = axios.create({ baseURL });
api.interceptors.request.use((config) => { const token = localStorage.getItem('@siscob:token'); if (token) { config.headers.Authorization = `Bearer ${token}`; } return config; }, (error) => Promise.reject(error));
api.interceptors.response.use((response) => {
  // Permite obter a resposta completa (com headers) quando rawResponse estiver setado na config.
  if ((response.config as any)?.rawResponse) {
    return response;
  }
  return response.data;
}, (error) => { if (axios.isAxiosError(error) && error.response?.status === 401) { console.warn('[Axios Interceptor] Erro 401. Realizando logout forçado.'); localStorage.removeItem('@siscob:token'); if (window.location.pathname !== '/login') { window.location.href = '/login'; } } return Promise.reject(error); });
export const extractErrorMessage = (error: unknown): string => { if (axios.isAxiosError(error)) { const axiosError = error as AxiosError<ApiError>; return axiosError.response?.data?.message || `Request failed with status code ${axiosError.response?.status}`; } if (error instanceof Error) return error.message; return 'Ocorreu um erro desconhecido.'; };

// --- Serviços da API ---
const apiService = {
  login: (credentials: { email: string; senha: string }): Promise<{ token: string }> => api.post('/auth/login', credentials),
  authGoogle: (id_token: string): Promise<{ token?: string; needsApproval?: boolean; profile?: { nome: string; email: string } }> => api.post('/auth/google', { id_token }),
  solicitarAcesso: (payload: ISolicitacaoAcessoPayload): Promise<{ message: string }> => api.post('/acesso/solicitar', payload),
  solicitarAcessoGoogle: (payload: { nome: string; email: string; obm_id: number }): Promise<{ message: string }> => api.post('/acesso/solicitar-google', payload),
  getSolicitacoes: (): Promise<ISolicitacao[]> => api.get('/acesso'),
  gerenciarSolicitacao: (id: number, acao: 'aprovar' | 'recusar'): Promise<{ message: string }> => api.put(`/acesso/${id}/gerenciar`, { acao }),
  getCrbms: (): Promise<ICrbm[]> => api.get('/crbms'),
  // Para telas públicas use a rota pública; após login, pode-se usar '/unidades'
  getCidades: (): Promise<ICidade[]> => api.get('/acesso/obms-public'),
  getNaturezas: (): Promise<IDataApoio[]> => api.get('/naturezas'),
  getNaturezasPorNomes: (nomes: string[]): Promise<IDataApoio[]> => api.post('/naturezas/por-nomes', { nomes }),
  criarOcorrencia: (payload: IOcorrenciaPayload): Promise<{ message: string; ocorrenciaId: number }> => api.post('/ocorrencias', payload),
  getOcorrencias: (page = 1, limit = 10): Promise<IPaginatedOcorrencias> => api.get(`/ocorrencias?page=${page}&limit=${limit}`),
  updateOcorrencia: (id: number, data: { data_ocorrencia: string; natureza_id: number; obm_id: number; }): Promise<{ message: string; ocorrencia: IOcorrencia }> => api.put(`/ocorrencias/${id}`, data),
  deleteOcorrencia: (id: number): Promise<{ message: string }> => api.delete(`/ocorrencias/${id}`),
  setOcorrenciaDestaque: (ocorrencia_id: number | null): Promise<any> => api.post('/plantao/destaque', { ocorrencia_id }),
  getDashboardStats: (inicio?: string, fim?: string): Promise<IDashboardStats> => api.get('/dashboard/stats', { params: { inicio, fim } }),
  getPlantao: (inicio?: string, fim?: string): Promise<IPlantao> => api.get('/plantao', { params: { inicio, fim } }),
  getSupervisores: (): Promise<ISupervisor[]> => api.get('/plantao/supervisores'),
  setSupervisorPlantao: (usuario_id: number | null): Promise<any> => api.post('/plantao/supervisor', { usuario_id }),
  getUsuarios: (): Promise<IUser[]> => api.get('/usuarios'),
  criarUsuario: (data: Omit<IUser, 'id'> & { senha?: string }): Promise<{ message: string; usuario: IUser }> => api.post('/usuarios', data),
  updateUsuario: (id: number, data: Partial<IUser>): Promise<{ message: string; usuario: IUser }> => api.put(`/usuarios/${id}`, data),
  deleteUsuario: (id: number): Promise<{ message: string }> => api.delete(`/usuarios/${id}`),
  registrarEstatisticasLote: (payload: IEstatisticaLotePayload): Promise<{ message: string }> => api.post('/estatisticas/lote', payload),
  getEstatisticasAgrupadasPorIntervalo: (dataInicio: string, dataFim: string): Promise<IEstatisticaAgrupada[]> => api.get('/estatisticas/por-intervalo', { params: { dataInicio, dataFim } }),
  limparDadosPorIntervalo: (dataInicio: string, dataFim: string): Promise<{ message: string }> => api.delete('/limpeza/intervalo', { params: { dataInicio, dataFim } }),
  getRelatorioCompleto: (data_inicio: string, data_fim: string): Promise<IRelatorioCompleto> => api.get('/relatorio-completo', { params: { data_inicio, data_fim } }),
  getObitosPorData: (data: string): Promise<IObitoRegistro[]> => api.get('/obitos-registros', { params: { data } }),
  criarObitoRegistro: (payload: IObitoRegistroPayload): Promise<IObitoRegistro> => api.post('/obitos-registros', payload),
  atualizarObitoRegistro: (id: number, payload: IObitoRegistroPayload): Promise<IObitoRegistro> => api.put(`/obitos-registros/${id}`, payload),
  deletarObitoRegistro: (id: number): Promise<{ message: string }> => api.delete(`/obitos-registros/${id}`),
  limparRegistrosDoDia: (data: string): Promise<{ message:string }> => api.delete('/obitos-registros', { params: { data } }),
  createUnidade: (data: { nome: string; crbm_id: number }): Promise<IObm> => api.post('/unidades', data),
  updateUnidade: (id: number, data: { nome: string; crbm_id: number }): Promise<IObm> => api.put(`/unidades/${id}`, data),
  deleteUnidade: (id: number): Promise<{ message: string }> => api.delete(`/unidades/${id}`),
  createNatureza: (data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => api.post('/naturezas', data),
  updateNatureza: (id: number, data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => api.put(`/naturezas/${id}`, data),
  deleteNatureza: (id: number): Promise<{ message: string }> => api.delete(`/naturezas/${id}`),
  alterarPropriaSenha: (payload: { senhaAtual: string; novaSenha: string }): Promise<{ message: string }> => api.put('/perfil/alterar-senha', payload),
  getAuditoriaLogs: (page = 1, limit = 20): Promise<IPaginatedAuditoriaLogs> => api.get('/auditoria', { params: { page, limit } }),
  getSisgpoViaturasEmpenhadas: (force = false): Promise<ISisgpoEmpenhoResponse> =>
    api.get('/sisgpo/viaturas/empenhadas', {
      params: force ? { force: true } : undefined,
    }),

  // New service for pending OBMs
  getObmsPendentesPorIntervalo: (dataInicio: string, dataFim: string): Promise<IPendingObm[]> => api.get('/obms/pendentes-por-intervalo', { params: { dataInicio, dataFim } }),
  // ======================= INÍCIO DA CORREÇÃO =======================
  // Adicionando a função que faltava ao objeto de serviço.
  // Esta função é usada pelo 'ocorrenciaDetalhadaService.ts'
  getOcorrenciasDetalhadasPorIntervalo: (dataInicio: string, dataFim: string): Promise<IOcorrenciaDetalhada[]> => api.get('/ocorrencias-detalhadas/por-intervalo', { params: { dataInicio, dataFim } }),
  // ======================= FIM DA CORREÇÃO =======================
};

// Adicionando a função à exportação desestruturada
export const {
  login, solicitarAcesso, getSolicitacoes, gerenciarSolicitacao,
  authGoogle, solicitarAcessoGoogle,
  getCrbms, getCidades, getNaturezas, getNaturezasPorNomes,
  criarOcorrencia, getOcorrencias, updateOcorrencia, deleteOcorrencia, setOcorrenciaDestaque,
  getDashboardStats, getPlantao, getSupervisores, setSupervisorPlantao,
  getUsuarios, criarUsuario, updateUsuario, deleteUsuario,
  registrarEstatisticasLote, getEstatisticasAgrupadasPorIntervalo,
  limparDadosPorIntervalo, getRelatorioCompleto,
  getObitosPorData, criarObitoRegistro, atualizarObitoRegistro, deletarObitoRegistro, limparRegistrosDoDia,
  createUnidade, updateUnidade, deleteUnidade, createNatureza, updateNatureza, deleteNatureza,
  alterarPropriaSenha,   getAuditoriaLogs,
  getSisgpoViaturasEmpenhadas,
  // New export
  getObmsPendentesPorIntervalo,
  // ======================= INÍCIO DA CORREÇÃO =======================
  // Exportando a função corrigida para que outros arquivos possam importá-la
  getOcorrenciasDetalhadasPorIntervalo
  // ======================= FIM DA CORREÇÃO =======================
} = apiService;

const normalizeSisgpoPath = (path: string): string => {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (!path.startsWith('/admin')) {
    throw new Error('Sisgpo proxy path deve iniciar com /admin.');
  }

  return path;
};

export const sisgpoApi = {
  get: sisgpoGet,
  post: async <T = unknown>(path: string, payload?: any): Promise<T> => {
    const normalized = normalizeSisgpoPath(path);
    return api.post<T>(`/sisgpo/proxy${normalized}`, payload);
  },
  put: async <T = unknown>(path: string, payload?: any): Promise<T> => {
    const normalized = normalizeSisgpoPath(path);
    return api.put<T>(`/sisgpo/proxy${normalized}`, payload);
  },
  delete: async <T = unknown>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const normalized = normalizeSisgpoPath(path);
    return api.delete<T>(`/sisgpo/proxy${normalized}`, config);
  },
};

async function sisgpoGet<T = unknown>(
  path: string,
  params?: Record<string, unknown>
): Promise<T>;
async function sisgpoGet<T = unknown>(
  path: string,
  params: Record<string, unknown> | undefined,
  options: { raw: true }
): Promise<AxiosResponse<T>>;
async function sisgpoGet<T = unknown>(
  path: string,
  params?: Record<string, unknown>,
  options?: { raw?: boolean }
): Promise<T | AxiosResponse<T>> {
  const normalized = normalizeSisgpoPath(path);
  const config: AxiosRequestConfig & { rawResponse?: boolean } = {
    params,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
  };

  if (options?.raw) {
    config.rawResponse = true;
  }

  // Quando rawResponse está habilitado, o interceptor devolve AxiosResponse completo.
  return api.get<T>(`/sisgpo/proxy${normalized}`, config as AxiosRequestConfig);
}
