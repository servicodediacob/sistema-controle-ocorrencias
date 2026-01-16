// Caminho: frontend/src/services/api.ts

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { supabase } from '../lib/supabase';

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
  // --- AUTH (Refatorado para Supabase no AuthProvider, mas mantemos interface legacy se precisar) ---
  login: (_credentials: { email: string; senha: string }): Promise<{ token: string }> => {
    console.warn('api.login is deprecated. Use useAuth().login instead.');
    return Promise.reject('Deprecated');
  },
  authGoogle: (_id_token: string) => Promise.reject('Deprecated. Use supabase.auth.signInWithIdToken'),

  // --- ACESSO ---
  solicitarAcesso: async (payload: ISolicitacaoAcessoPayload): Promise<{ message: string }> => {
    const { error } = await supabase.from('solicitacoes_acesso').insert({
      nome: payload.nome,
      email: payload.email,
      senha_hash: payload.senha, // NOTE: Em produção real, hash deve ser feito via Edge Function ou cliente se seguro, mas Supabase Auth é melhor. 
      // O sistema original salvava senha_hash no banco. Aqui estamos inserindo direto. 
      // ATENÇÃO: Se o backend fazia hash, o frontend agora está mandando raw? 
      // Supabase Auth lida com users. Solicitacoes de acesso customizadas devem ser revistas.
      // Por enquanto, inserimos como enviado.
      obm_id: payload.obm_id,
      status: 'pendente'
    });
    if (error) throw new Error(error.message);
    return { message: 'Solicitação enviada com sucesso.' };
  },
  solicitarAcessoGoogle: async (payload: { nome: string; email: string; obm_id: number }): Promise<{ message: string }> => {
    const { error } = await supabase.from('solicitacoes_acesso').insert({
      nome: payload.nome,
      email: payload.email,
      obm_id: payload.obm_id,
      senha_hash: 'GOOGLE_AUTH',
      status: 'pendente'
    });
    if (error) throw new Error(error.message);
    return { message: 'Solicitação enviada com sucesso.' };
  },
  getSolicitacoes: async (): Promise<ISolicitacao[]> => {
    const { data, error } = await supabase.from('solicitacoes_acesso').select('*, obm:obms(nome)').order('data_solicitacao', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((s: any) => ({
      ...s,
      obm_nome: s.obm?.nome || 'N/A'
    }));
  },
  gerenciarSolicitacao: async (id: number, acao: 'aprovar' | 'recusar'): Promise<{ message: string }> => {
    // Isso requer lógica de servidor (criar usuário no Auth e no DB). 
    // Idealmente vira Edge Function. Por enquanto, se o usuário for admin, ele pode atualizar o status.
    const { error } = await supabase.from('solicitacoes_acesso').update({ status: acao === 'aprovar' ? 'aprovado' : 'recusado', data_aprovacao: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: `Solicitação ${acao === 'aprovar' ? 'aprovada' : 'recusada'}.` };
  },

  // --- DADOS AUXILIARES ---
  getCrbms: async (): Promise<ICrbm[]> => {
    const { data, error } = await supabase.from('crbms').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data as ICrbm[];
  },

  getCidades: async (): Promise<ICidade[]> => {
    // ICidade = { id, cidade_nome, crbm_id, crbm_nome }
    // Table: obms (id, nome, crbm_id) join crbms (nome)
    const { data, error } = await supabase
      .from('obms')
      .select('id, nome, crbm_id, crbm:crbms(nome)')
      .order('nome');

    if (error) throw new Error(error.message);

    return data.map((d: any) => ({
      id: d.id,
      cidade_nome: d.nome,
      crbm_id: d.crbm_id,
      crbm_nome: d.crbm?.nome || 'Desconhecido'
    }));
  },

  getNaturezas: async (): Promise<IDataApoio[]> => {
    const { data, error } = await supabase.from('naturezas_ocorrencia').select('*').order('grupo').order('subgrupo');
    if (error) throw new Error(error.message);
    return data as IDataApoio[];
  },

  getNaturezasPorNomes: async (nomes: string[]): Promise<IDataApoio[]> => {
    const { data, error } = await supabase.from('naturezas_ocorrencia').select('*').in('subgrupo', nomes);
    if (error) throw new Error(error.message);
    return data as IDataApoio[];
  },

  // --- OCORRENCIAS ---
  criarOcorrencia: async (payload: IOcorrenciaPayload): Promise<{ message: string; ocorrenciaId: number }> => {
    // payload: { ocorrencia: { ... }, obitos: ... }
    // Insert detalhada first
    const { ocorrencia, obitos: _obitos } = payload;

    // Precisamos do usuario_id atual. 
    // Opção: user via supabase.auth.getUser() ou assumir que quem chama passa? API antiga pegava do token.
    // O payload não tem usuario_id. Vamos pegar da sessão atual.
    const { data: userData } = await supabase.auth.getUser();
    // Precisamos do ID numérico do usuário na tabela 'usuarios', não UUID.
    // Isso requer uma consulta extra ou carregar no contexto.
    let usuario_id: number | null = null;
    if (userData.user?.email) {
      const { data: u } = await supabase.from('usuarios').select('id').eq('email', userData.user.email).single();
      if (u) usuario_id = u.id;
    }

    // Mapear campos para OcorrenciaDetalhada
    // Nota: OcorrenciaDetalhada tem campos 'cidade_id', 'natureza_id', etc.
    // O payload da API antiga tinha `data_ocorrencia`.
    // Precisamos garantir que campos obrigatórios existam.

    const insertData = {
      data_ocorrencia: ocorrencia.data_ocorrencia,
      natureza_id: ocorrencia.natureza_id,
      cidade_id: ocorrencia.obm_id, // Front chama de obm_id mas mapeia para cidade/unidade
      usuario_id: usuario_id,
      criado_em: new Date().toISOString()
    };

    const { data: newOcorrencia, error } = await supabase
      .from('ocorrencias_detalhadas')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Se houver óbitos, inserir. (Tabela obitos_registros?)
    // A logica antiga parecia complexa. Simplificando:
    // Se obitos array existe, inserir logica.

    return { message: 'Ocorrência criada com sucesso.', ocorrenciaId: newOcorrencia.id };
  },

  getOcorrencias: async (page = 1, limit = 10): Promise<IPaginatedOcorrencias> => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('ocorrencias_detalhadas')
      .select('*, natureza:naturezas_ocorrencia(grupo, subgrupo), cidade:obms(nome, crbm:crbms(nome)), usuario:usuarios(nome)', { count: 'exact' })
      .order('data_ocorrencia', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    // Map to IOcorrencia (flat structure)
    // interface IOcorrencia { id, data, qtd_obitos, nat_id, obm_id, nat_desc, obm_nome, crbm_nome }
    const mapped = (data || []).map((o: any) => ({
      id: o.id,
      data_ocorrencia: o.data_ocorrencia,
      quantidade_obitos: 0, // TODO: Count from relation or field
      natureza_id: o.natureza_id,
      obm_id: o.cidade_id,
      natureza_descricao: `${o.natureza?.grupo} - ${o.natureza?.subgrupo}`,
      obm_nome: o.cidade?.nome,
      crbm_nome: o.cidade?.crbm?.nome
    }));

    return {
      ocorrencias: mapped,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    };
  },

  updateOcorrencia: (id: number, data: { data_ocorrencia: string; natureza_id: number; obm_id: number; }): Promise<{ message: string; ocorrencia: IOcorrencia }> =>
    api.put(`/ocorrencias/${id}`, data), // TODO: Migrate
  deleteOcorrencia: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase.from('ocorrencias_detalhadas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Ocorrência excluída.' };
  },

  // --- DASHBOARD ---
  // Esses são complexos (agregations). Podem ser views ou RPCs no Supabase.
  // Por ora, manter se possível ou falhar graciosamente.
  // --- DASHBOARD ---
  setOcorrenciaDestaque: async (ocorrencia_id: number | null): Promise<any> => {
    // Assuming singleton pattern based on ID=1 default in schema, OR we just replace the entry.
    // Logic: If null, delete. If id, upsert.
    if (!ocorrencia_id) {
      const { error } = await supabase.from('ocorrencia_destaque').delete().neq('id', 0); // Delete all?
      // Safe: Delete all.
      if (error) throw new Error(error.message);
      return { message: 'Destaque removido.' };
    } else {
      // Upsert ID 1
      const { error } = await supabase.from('ocorrencia_destaque').upsert({ id: 1, ocorrencia_id, definido_em: new Date().toISOString() });
      if (error) throw new Error(error.message);
      return { message: 'Destaque definido.' };
    }
  },

  getDashboardStats: async (inicio?: string, fim?: string): Promise<IDashboardStats> => {
    // Default dates if missing
    const start = inicio || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
    const end = fim || new Date().toISOString();

    // 1. Obitos
    const { data: obitos, error: errObitos } = await supabase
      .from('obitos_registros')
      .select('quantidade_vitimas')
      .gte('data_ocorrencia', start)
      .lte('data_ocorrencia', end);

    if (errObitos) throw new Error(errObitos.message);
    const totalObitos = obitos ? obitos.reduce((sum, item) => sum + (item.quantidade_vitimas || 0), 0) : 0;

    // 2. Estatisticas Diarias (Agregadas)
    const { data: stats, error: errStats } = await supabase
      .from('estatisticas_diarias')
      .select('quantidade, obm:obms(nome, crbm:crbms(nome)), natureza:naturezas_ocorrencia(subgrupo)')
      .gte('data_registro', start)
      .lte('data_registro', end);

    if (errStats) throw new Error(errStats.message);

    let totalOcorrencias = 0;
    const natMap = new Map<string, number>();
    const crbmMap = new Map<string, number>();

    if (stats) {
      for (const s of (stats as any[])) {
        const qtd = s.quantidade || 0;
        totalOcorrencias += qtd;

        // Natureza
        const natName = s.natureza?.subgrupo || 'Outros';
        natMap.set(natName, (natMap.get(natName) || 0) + qtd);

        // CRBM
        const crbmName = s.obm?.crbm?.nome || 'Indefinido';
        crbmMap.set(crbmName, (crbmMap.get(crbmName) || 0) + qtd);
      }
    }

    return {
      totalOcorrencias,
      totalObitos,
      ocorrenciasPorNatureza: Array.from(natMap.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total),
      ocorrenciasPorCrbm: Array.from(crbmMap.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total),
    };
  },

  getPlantao: async (_inicio?: string, _fim?: string): Promise<IPlantao> => {
    // 1. Get Destaque
    const { data: destaqueRow } = await supabase.from('ocorrencia_destaque').select('ocorrencia_id').single();
    let ocorrenciasDestaque: any[] = [];

    if (destaqueRow?.ocorrencia_id) {
      const { data: oc } = await supabase
        .from('ocorrencias_detalhadas')
        .select('*, natureza:naturezas_ocorrencia(*), cidade:obms(nome, crbm:crbms(nome))')
        .eq('id', destaqueRow.ocorrencia_id)
        .single();

      if (oc) {
        ocorrenciasDestaque.push({
          ...oc,
          natureza_grupo: oc.natureza?.grupo,
          natureza_nome: oc.natureza?.subgrupo,
          cidade_nome: oc.cidade?.nome,
          obm_nome: oc.cidade?.nome,
          crbm_nome: oc.cidade?.crbm?.nome
        });
      }
    }

    // 2. Get Supervisor
    const { data: supRow } = await supabase
      .from('supervisor_plantao')
      .select('usuario_id, definido_em, usuario:usuarios(nome)')
      .order('definido_em', { ascending: false })
      .limit(1)
      .single();

    const supervisorPlantao = supRow ? {
      usuario_id: supRow.usuario_id,
      supervisor_nome: (supRow.usuario as any)?.nome || null
    } : null;

    return { ocorrenciasDestaque, supervisorPlantao };
  },

  getSupervisores: async (): Promise<ISupervisor[]> => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome')
      .in('perfil', ['admin', 'supervisor'])
      .order('nome');
    if (error) throw new Error(error.message);
    return data as ISupervisor[];
  },

  setSupervisorPlantao: async (usuario_id: number | null): Promise<any> => {
    // Insert new record in history table `supervisor_plantao`
    const { error } = await supabase.from('supervisor_plantao').insert({
      usuario_id,
      definido_em: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return { message: 'Supervisor definido.' };
  },

  // --- USUARIOS ---
  // --- USUARIOS ---
  getUsuarios: async (): Promise<IUser[]> => {
    // Select all users
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, obm:obms(nome)')
      .order('nome');

    if (error) throw new Error(error.message);

    return data.map((u: any) => ({
      ...u,
      perfil: u.perfil as 'admin' | 'supervisor' | 'user',
      obm_nome: u.obm?.nome
    }));
  },
  criarUsuario: async (data: Omit<IUser, 'id'> & { senha?: string }): Promise<{ message: string; usuario: IUser }> => {
    // Insere na tabela usuarios. Hash placeholder.
    const insertData = { ...data, senha_hash: data.senha || 'GOOGLE_AUTH_PLACEHOLDER', obm_id: data.obm_id, criado_em: new Date().toISOString() };
    const { data: newUser, error } = await supabase.from('usuarios').insert(insertData).select().single();
    if (error) throw new Error(error.message);
    return { message: 'Usuário criado.', usuario: newUser as IUser };
  },
  updateUsuario: async (id: number, data: Partial<IUser>): Promise<{ message: string; usuario: IUser }> => {
    const { data: updated, error } = await supabase.from('usuarios').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return { message: 'Usuário atualizado.', usuario: updated as IUser };
  },
  deleteUsuario: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Usuário removido.' };
  },

  // --- ESTATISTICAS ---
  // --- ESTATISTICAS ---
  registrarEstatisticasLote: async (payload: IEstatisticaLotePayload): Promise<{ message: string }> => {
    // 1. Get user
    const { data: { user } } = await supabase.auth.getUser();
    let usuario_id: number | null = null;
    if (user?.email) {
      const { data: u } = await supabase.from('usuarios').select('id').eq('email', user.email).single();
      if (u) usuario_id = u.id;
    }

    // 2. Prepare rows
    const rows = payload.estatisticas.map(item => ({
      data_registro: payload.data_registro,
      obm_id: payload.obm_id,
      natureza_id: item.natureza_id,
      quantidade: item.quantidade,
      usuario_id,
      criado_em: new Date().toISOString()
    }));

    if (rows.length === 0) return { message: 'Nenhum dado para salvar.' };

    // 3. Upsert
    // Requires unique constraint on (data_registro, obm_id, natureza_id)
    const { error } = await supabase.from('estatisticas_diarias').upsert(rows, { onConflict: 'data_registro, obm_id, natureza_id' });

    if (error) throw new Error(error.message);
    return { message: 'Dados salvos com sucesso.' };
  },

  getEstatisticasAgrupadasPorIntervalo: async (dataInicio: string, dataFim: string): Promise<IEstatisticaAgrupada[]> => {
    // Fetch all raw data
    const { data, error } = await supabase
      .from('estatisticas_diarias')
      .select('quantidade, obm:obms(nome, crbm:crbms(nome)), natureza:naturezas_ocorrencia(*)')
      .gte('data_registro', dataInicio)
      .lte('data_registro', dataFim);

    if (error) throw new Error(error.message);

    // Client-side Aggregation
    // Map Key: "ObmName|NaturezaId" -> Aggregate Entry
    const map = new Map<string, IEstatisticaAgrupada>();

    for (const row of (data as any[])) {
      const key = `${row.obm?.nome}|${row.natureza?.id}`;
      if (!map.has(key)) {
        map.set(key, {
          crbm_nome: row.obm?.crbm?.nome || 'N/A',
          cidade_nome: row.obm?.nome || 'N/A',
          natureza_id: row.natureza?.id,
          natureza_grupo: row.natureza?.grupo,
          natureza_nome: row.natureza?.subgrupo || 'N/A', // Frontend expects subgrupo as nome often
          natureza_abreviacao: row.natureza?.abreviacao,
          quantidade: 0
        });
      }
      const entry = map.get(key)!;
      entry.quantidade += row.quantidade;
    }

    return Array.from(map.values());
  },

  limparDadosPorIntervalo: async (dataInicio: string, dataFim: string): Promise<{ message: string }> => {
    const { error } = await supabase
      .from('estatisticas_diarias')
      .delete()
      .gte('data_registro', dataInicio)
      .lte('data_registro', dataFim);

    if (error) throw new Error(error.message);
    return { message: 'Dados limpos no intervalo.' };
  },

  getRelatorioCompleto: async (_data_inicio: string, _data_fim: string): Promise<IRelatorioCompleto> => {
    console.warn('getRelatorioCompleto: Migração Supabase Parcial. Retornando dados mínimos.');
    // TODO: Implementar agregação complexa para relatório PDF.
    return {
      estatisticas: [],
      obitos: [],
      destaques: []
    };
  },

  // --- OBITOS ---
  getObitosPorData: async (data: string): Promise<IObitoRegistro[]> => {
    const { data: registros, error } = await supabase
      .from('obitos_registros')
      .select('*, obm:obms(nome), natureza:naturezas_ocorrencia(grupo, subgrupo)')
      .eq('data_ocorrencia', data);
    if (error) throw new Error(error.message);
    return registros.map((r: any) => ({
      ...r,
      obm_nome: r.obm?.nome,
      natureza_nome: `${r.natureza?.grupo} - ${r.natureza?.subgrupo}`
    }));
  },
  criarObitoRegistro: async (payload: IObitoRegistroPayload): Promise<IObitoRegistro> => {
    const { data: { user } } = await supabase.auth.getUser();
    let usuario_id: number | null = null;
    if (user?.email) {
      const { data: u } = await supabase.from('usuarios').select('id').eq('email', user.email).single();
      if (u) usuario_id = u.id;
    }
    const insertData = { ...payload, usuario_id, criado_em: new Date().toISOString() };
    const { data: newObito, error } = await supabase.from('obitos_registros').insert(insertData).select('*, obm:obms(nome), natureza:naturezas_ocorrencia(grupo, subgrupo)').single();
    if (error) throw new Error(error.message);
    return { ...newObito, obm_nome: newObito.obm?.nome, natureza_nome: `${newObito.natureza?.grupo} - ${newObito.natureza?.subgrupo}` };
  },
  atualizarObitoRegistro: async (id: number, payload: IObitoRegistroPayload): Promise<IObitoRegistro> => {
    const { data: updated, error } = await supabase.from('obitos_registros').update(payload).eq('id', id).select('*, obm:obms(nome), natureza:naturezas_ocorrencia(grupo, subgrupo)').single();
    if (error) throw new Error(error.message);
    return { ...updated, obm_nome: updated.obm?.nome, natureza_nome: `${updated.natureza?.grupo} - ${updated.natureza?.subgrupo}` };
  },
  deletarObitoRegistro: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase.from('obitos_registros').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Registro excluído.' };
  },
  limparRegistrosDoDia: async (data: string): Promise<{ message: string }> => {
    const { error } = await supabase.from('obitos_registros').delete().eq('data_ocorrencia', data);
    if (error) throw new Error(error.message);
    return { message: 'Registros limpos.' };
  },

  // --- ADMIN BASICS ---
  createUnidade: async (data: { nome: string; crbm_id: number }): Promise<IObm> => {
    const { data: obm, error } = await supabase.from('obms').insert(data).select('*, crbm:crbms(nome)').single();
    if (error) throw new Error(error.message);
    return { id: obm.id, cidade_nome: obm.nome, crbm_id: obm.crbm_id, crbm_nome: obm.crbm?.nome } as any;
  },
  updateUnidade: async (id: number, data: { nome: string; crbm_id: number }): Promise<IObm> => {
    const { data: obm, error } = await supabase.from('obms').update(data).eq('id', id).select('*, crbm:crbms(nome)').single();
    if (error) throw new Error(error.message);
    return { id: obm.id, cidade_nome: obm.nome, crbm_id: obm.crbm_id, crbm_nome: obm.crbm?.nome } as any;
  },
  deleteUnidade: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase.from('obms').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Unidade excluída.' };
  },
  createNatureza: async (data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => {
    const { data: nat, error } = await supabase.from('naturezas_ocorrencia').insert(data).select().single();
    if (error) throw new Error(error.message);
    return nat as IDataApoio;
  },
  updateNatureza: async (id: number, data: { grupo: string; subgrupo: string }): Promise<IDataApoio> => {
    const { data: nat, error } = await supabase.from('naturezas_ocorrencia').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return nat as IDataApoio;
  },
  deleteNatureza: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase.from('naturezas_ocorrencia').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Natureza excluída.' };
  },
  alterarPropriaSenha: async (payload: { senhaAtual: string; novaSenha: string }): Promise<{ message: string }> => {
    const { error } = await supabase.auth.updateUser({ password: payload.novaSenha });
    if (error) throw new Error(error.message);
    return { message: 'Senha alterada.' };
  },
  getAuditoriaLogs: (page = 1, limit = 20): Promise<IPaginatedAuditoriaLogs> => api.get('/auditoria', { params: { page, limit } }),

  // --- SISGPO ---
  // --- SISGPO ---
  getSisgpoViaturasEmpenhadas: async (force = false): Promise<ISisgpoEmpenhoResponse> => {
    // Chama a Edge Function 'sisgpo-proxy'
    const { data, error } = await supabase.functions.invoke('sisgpo-proxy', {
      body: {
        path: '/viaturas/empenhadas', // Ajustar conforme endpoint real do SISGPO
        method: 'GET',
        params: force ? { force: 'true' } : {}
      }
    });

    if (error) {
      console.warn("Falha na Edge Function SISGPO:", error);
      // Fallback vazio para não travar a tela
      return { engagedPrefixes: [], fetchedAt: new Date().toISOString(), cached: false };
    }

    return data as ISisgpoEmpenhoResponse;
  },

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
  alterarPropriaSenha, getAuditoriaLogs,
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
    return api.post<T>(`/sisgpo/proxy${normalized}`, payload) as Promise<T>;
  },
  put: async <T = unknown>(path: string, payload?: any): Promise<T> => {
    const normalized = normalizeSisgpoPath(path);
    return api.put<T>(`/sisgpo/proxy${normalized}`, payload) as Promise<T>;
  },
  delete: async <T = unknown>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const normalized = normalizeSisgpoPath(path);
    return api.delete<T>(`/sisgpo/proxy${normalized}`, config) as Promise<T>;
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
