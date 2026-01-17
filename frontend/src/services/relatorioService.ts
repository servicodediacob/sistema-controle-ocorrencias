import { api, extractErrorMessage, IRelatorioCompleto } from './api';

// Busca o relatório completo no intervalo informado.
// O Axios instance já retorna apenas response.data via interceptor.
const BACKEND_AVAILABLE = !import.meta.env.VITE_API_BASE_URL?.includes('supabase.co');

export const getRelatorioCompleto = async (
  data_inicio: string,
  data_fim: string
): Promise<IRelatorioCompleto> => {
  if (!BACKEND_AVAILABLE) {
    // Retorna objeto vazio/mockado para evitar erro 401/404 no Supabase
    return {
      estatisticas: [],
      totalGeralEstatisticas: 0,
      obitos: [],
      totalObitos: 0,
      destaques: [],
      usuarioNome: 'Modo Supabase',
      dataInicio: data_inicio,
      dataFim: data_fim,
      fallback: true
    } as any;
  }

  try {
    const data = await api.get('/relatorio-completo', { params: { data_inicio, data_fim } });
    // O tipo do AxiosInstance com interceptor ainda é AxiosResponse; fazemos cast seguro.
    return data as unknown as IRelatorioCompleto;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const limparDadosPorIntervalo = async (
  data_inicio: string,
  data_fim: string
): Promise<void> => {
  try {
    await api.delete('/limpeza/intervalo', { params: { dataInicio: data_inicio, dataFim: data_fim } });
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
