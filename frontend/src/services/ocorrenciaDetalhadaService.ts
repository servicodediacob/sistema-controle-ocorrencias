// frontend/src/services/ocorrenciaDetalhadaService.ts

import { api, extractErrorMessage } from './api';

export interface IOcorrenciaDetalhadaPayload {
  numero_ocorrencia?: string;
  natureza_id: number;
  endereco?: string;
  bairro?: string;
  cidade_id: number;
  viaturas?: string;
  veiculos_envolvidos?: string;
  dados_vitimas?: string;
  resumo_ocorrencia: string;
  data_ocorrencia: string;
  horario_ocorrencia?: string;
}

// ======================= INÍCIO DA CORREÇÃO =======================
// A interface agora reflete 100% a estrutura de dados que a API retorna,
// incluindo os campos que vêm dos JOINs no banco de dados.
export interface IOcorrenciaDetalhada {
  id: number;
  numero_ocorrencia?: string;
  natureza_id: number;
  natureza_grupo: string; // Campo que estava faltando
  natureza_nome: string;  // Campo que estava faltando
  endereco?: string;
  bairro?: string;
  cidade_id: number;
  cidade_nome: string;    // Campo que estava faltando
  viaturas?: string;
  veiculos_envolvidos?: string;
  dados_vitimas?: string;
  resumo_ocorrencia: string;
  data_ocorrencia: string;
  horario_ocorrencia?: string;
  usuario_id: number;
}
// ======================= FIM DA CORREÇÃO =======================

export const criarOcorrenciaDetalhada = async (payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.post('/ocorrencias-detalhadas', payload);
    // O interceptor do axios já retorna response.data
    return response as unknown as IOcorrenciaDetalhada;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getOcorrenciasDetalhadasPorIntervalo = async (dataInicio: string, dataFim: string): Promise<IOcorrenciaDetalhada[]> => {
  try {
    const response = await api.get('/ocorrencias-detalhadas/por-intervalo', {
      params: { dataInicio, dataFim }
    });
    return response as unknown as IOcorrenciaDetalhada[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const atualizarOcorrenciaDetalhada = async (id: number, payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.put(`/ocorrencias-detalhadas/${id}`, payload);
    return response as unknown as IOcorrenciaDetalhada;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deletarOcorrenciaDetalhada = async (id: number): Promise<void> => {
  try {
    // A chamada DELETE não retorna corpo, então não precisamos do .then(res => res.data)
    await api.delete(`/ocorrencias-detalhadas/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
