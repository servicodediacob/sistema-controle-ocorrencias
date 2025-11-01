import { api } from './api';

export const registrarNavegacao = async (userId: number, pathname: string, search: string) => {
  try {
    await api.post('/api/auditoria/navigation', { userId, pathname, search });
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
    await api.post('/api/auditoria/relatorio', { userId, tipo, filtros, assinatura });
  } catch (error) {
    // Fail silently
    console.error('Failed to log report generation event:', error);
  }
};

export const registrarAberturaChat = async (userId: number, partnerId: number) => {
  try {
    await api.post('/api/auditoria/chat/abertura', { userId, partnerId });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat open event:', error);
  }
};

export const registrarFechamentoChat = async (userId: number, partnerId: number) => {
  try {
    await api.post('/api/auditoria/chat/fechamento', { userId, partnerId });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat close event:', error);
  }
};

export const registrarMensagemChat = async (userId: number, partnerId: number, message: string) => {
  try {
    await api.post('/api/auditoria/chat/mensagem', { userId, partnerId, message });
  } catch (error) {
    // Fail silently
    console.error('Failed to log chat message event:', error);
  }
};
