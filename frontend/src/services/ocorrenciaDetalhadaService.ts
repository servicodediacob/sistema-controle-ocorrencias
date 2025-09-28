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
// A interface agora inclui todos os campos retornados pela API, incluindo os IDs
export interface IOcorrenciaDetalhada {
  id: number;
  numero_ocorrencia?: string;
  natureza_id: number;
  natureza_nome: string;
  endereco?: string;
  bairro?: string;
  cidade_id: number;
  cidade_nome: string;
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
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getOcorrenciasDetalhadas = async (data: string): Promise<IOcorrenciaDetalhada[]> => {
  try {
    const response = await api.get('/ocorrencias-detalhadas', {
      params: { data_ocorrencia: data }
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const atualizarOcorrenciaDetalhada = async (id: number, payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.put(`/ocorrencias-detalhadas/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// ======================= INÍCIO DA CORREÇÃO =======================
// A função de deletar agora espera uma resposta vazia (status 204)
export const deletarOcorrenciaDetalhada = async (id: number): Promise<void> => {
  try {
    await api.delete(`/ocorrencias-detalhadas/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
// ======================= FIM DA CORREÇÃO =======================
