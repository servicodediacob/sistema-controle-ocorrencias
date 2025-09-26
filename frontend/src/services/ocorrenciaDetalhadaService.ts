// Caminho: frontend/src/services/ocorrenciaDetalhadaService.ts

import { api, extractErrorMessage } from './api';

// ======================= INÍCIO DA CORREÇÃO =======================
// 1. Interface para o payload de ENVIO (o que o formulário manda)
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

// 2. Interface para o dado RECEBIDO (o que a API retorna na listagem)
//    Agora inclui os IDs necessários para a edição.
export interface IOcorrenciaDetalhada {
  id: number;
  numero_ocorrencia?: string;
  natureza_id: number; // Campo adicionado
  natureza_nome: string;
  endereco?: string;
  bairro?: string;
  cidade_id: number; // Campo adicionado
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

/**
 * @description Cria uma nova ocorrência detalhada.
 */
export const criarOcorrenciaDetalhada = async (payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.post('/ocorrencias-detalhadas', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * @description Busca todas as ocorrências detalhadas para uma data específica.
 */
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

// ======================= INÍCIO DA CORREÇÃO =======================
/**
 * @description Atualiza uma ocorrência detalhada existente.
 */
export const atualizarOcorrenciaDetalhada = async (id: number, payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.put(`/ocorrencias-detalhadas/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * @description Deleta uma ocorrência detalhada.
 */
export const deletarOcorrenciaDetalhada = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/ocorrencias-detalhadas/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
// ======================= FIM DA CORREÇÃO =======================
