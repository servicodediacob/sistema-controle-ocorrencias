import { api, extractErrorMessage, IRelatorioCompleto } from './api';

// Busca o relatório completo no intervalo informado.
// O Axios instance já retorna apenas response.data via interceptor.
export const getRelatorioCompleto = async (
  data_inicio: string,
  data_fim: string
): Promise<IRelatorioCompleto> => {
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
