import { api } from './api';

const AUDITORIA_BASE = '/auditoria';

export const registrarNavegacao = async (userId: number, pathname: string, search: string) => {
  try {
    await api.post(`${AUDITORIA_BASE}/navigation`, { userId, pathname, search });
  } catch (error) {
    // Fail silently
    console.error('Failed to log navigation event:', error);
  }
};

export const registrarGeracaoRelatorio = async (
  userId: number,
  tipo: string,
  filtros: unknown,
  assinatura: unknown,
) => {
  try {
    await api.post(`${AUDITORIA_BASE}/relatorio`, { userId, tipo, filtros, assinatura });
  } catch (error) {
    // Fail silently
    console.error('Failed to log report generation event:', error);
  }
};

export const registrarAberturaChat = async (userId: number, partnerId: number) => {
  try {
    await api.post(`${AUDITORIA_BASE}/chat/abertura`, { userId, partnerId });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat open event:', error);
  }
};

export const registrarFechamentoChat = async (userId: number, partnerId: number) => {
  try {
    await api.post(`${AUDITORIA_BASE}/chat/fechamento`, { userId, partnerId });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat close event:', error);
  }
};

export const registrarMensagemChat = async (userId: number, partnerId: number, message: string) => {
  try {
    await api.post(`${AUDITORIA_BASE}/chat/mensagem`, { userId, partnerId, message });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat message event:', error);
  }
};
