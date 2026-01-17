import { api } from './api';

const AUDITORIA_BASE = '/auditoria';

// Flag para verificar se o backend Express está disponível
const BACKEND_AVAILABLE = !import.meta.env.VITE_API_BASE_URL?.includes('supabase.co');

export const registrarNavegacao = async (userId: number, pathname: string, search: string) => {
  if (!BACKEND_AVAILABLE) return; // Backend não disponível, ignora silenciosamente
  try {
    await api.post(`${AUDITORIA_BASE}/navigation`, { userId, pathname, search });
  } catch (error) {
    // Fail silently
  }
};

export const registrarGeracaoRelatorio = async (
  userId: number,
  tipo: string,
  filtros: unknown,
  assinatura: unknown,
) => {
  if (!BACKEND_AVAILABLE) return;
  try {
    await api.post(`${AUDITORIA_BASE}/relatorio`, { userId, tipo, filtros, assinatura });
  } catch (error) {
    // Fail silently
  }
};

export const registrarAberturaChat = async (userId: number, partnerId: number) => {
  if (!BACKEND_AVAILABLE) return;
  try {
    await api.post(`${AUDITORIA_BASE}/chat/abertura`, { userId, partnerId });
  } catch (error) {
    // Fail silently
  }
};

export const registrarFechamentoChat = async (userId: number, partnerId: number) => {
  if (!BACKEND_AVAILABLE) return;
  try {
    await api.post(`${AUDITORIA_BASE}/chat/fechamento`, { userId, partnerId });
  } catch (error) {
    // Fail silently
  }
};

export const registrarMensagemChat = async (userId: number, partnerId: number, message: string) => {
  if (!BACKEND_AVAILABLE) return;
  try {
    await api.post(`${AUDITORIA_BASE}/chat/mensagem`, { userId, partnerId, message });
  } catch (error) {
    // Fail silently
  }
};
