// Caminho: frontend/src/services/ocorrenciaDetalhadaService.ts

import { api, extractErrorMessage } from './api'; // Reutilizamos a instância do axios e o helper de erro

// As interfaces que pertencem a este contexto são movidas para cá
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

export interface IOcorrenciaDetalhada extends IOcorrenciaDetalhadaPayload {
  id: number;
  usuario_id: number;
  criado_em: string;
  natureza_nome: string;
  cidade_nome: string;
}

// Função para criar a ocorrência
export const criarOcorrenciaDetalhada = async (payload: IOcorrenciaDetalhadaPayload): Promise<IOcorrenciaDetalhada> => {
  try {
    const response = await api.post('/ocorrencias-detalhadas', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Função para buscar as ocorrências
export const getOcorrenciasDetalhadas = async (data: string): Promise<IOcorrenciaDetalhada[]> => {
  try {
    const response = await api.get('/ocorrencias-detalhadas', { params: { data } });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
