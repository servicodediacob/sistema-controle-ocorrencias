// Caminho: frontend/src/services/relatorioService.ts

import { api, extractErrorMessage, IRelatorioCompleto } from './api';

export const getRelatorioCompleto = async (data_inicio: string, data_fim: string): Promise<IRelatorioCompleto> => {
  try {
    const response = await api.get('/relatorio-completo', { params: { data_inicio, data_fim } });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
