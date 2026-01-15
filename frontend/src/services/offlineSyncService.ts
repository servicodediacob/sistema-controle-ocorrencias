// Caminho: frontend/src/services/offlineSyncService.ts

import localforage from 'localforage';
import { IEstatisticaLotePayload } from './api';

export interface PendingLancamento extends IEstatisticaLotePayload {
  id: string; // Um ID único para cada lançamento pendente
  timestamp: number; // Para ordenação ou expiração
  userId: number;
}

const OFFLINE_STORE_NAME = 'pendingLancamentos';

// Configura o localforage
localforage.config({
  driver: localforage.INDEXEDDB, // Força o uso de IndexedDB
  name: 'offlineAppDB',
  version: 1.0,
  storeName: OFFLINE_STORE_NAME,
  description: 'Armazenamento de lançamentos pendentes para sincronização offline',
});

export const offlineSyncService = {
  /**
   * Salva um lançamento como pendente para sincronização offline.
   * @param lancamento Os dados do lançamento.
   * @param userId O ID do usuário que está fazendo o lançamento.
   * @returns Promise<PendingLancamento>
   */
  async savePendingLancamento(lancamento: IEstatisticaLotePayload, userId: number): Promise<PendingLancamento> {
    const pendingLancamento: PendingLancamento = {
      ...lancamento,
      id: Date.now().toString(), // ID simples baseado em timestamp
      timestamp: Date.now(),
      userId: userId,
    };
    await localforage.setItem(pendingLancamento.id, pendingLancamento);
    return pendingLancamento;
  },

  /**
   * Retorna todos os lançamentos pendentes armazenados localmente, opcionalmente filtrando por usuário.
   * @param userId O ID do usuário para filtrar os lançamentos.
   * @returns Promise<PendingLancamento[]>
   */
  async getPendingLancamentos(userId?: number): Promise<PendingLancamento[]> {
    const lancamentos: PendingLancamento[] = [];
    await localforage.iterate((value: PendingLancamento, key, iterationNumber) => {
      if (!userId || value.userId === userId) {
        lancamentos.push(value);
      }
    });
    // Opcional: ordenar por timestamp
    return lancamentos.sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Remove um lançamento pendente específico pelo seu ID.
   * @param id O ID do lançamento a ser removido.
   * @returns Promise<void>
   */
  async removePendingLancamento(id: string): Promise<void> {
    await localforage.removeItem(id);
  },

  /**
   * Limpa todos os lançamentos pendentes.
   * @returns Promise<void>
   */
  async clearAllPendingLancamentos(): Promise<void> {
    await localforage.clear();
  },

  async setLastSyncStatus(status: 'success' | 'failed'): Promise<void> {
    const syncStatus = {
      timestamp: new Date().toISOString(),
      status: status,
    };
    await localforage.setItem('lastSyncStatus', syncStatus);
  },

  async getLastSyncStatus(): Promise<{ timestamp: string; status: string } | null> {
    return await localforage.getItem('lastSyncStatus');
  },

  /**
   * Sincroniza os lançamentos pendentes com o servidor para um usuário específico.
   * @param userId O ID do usuário para o qual sincronizar os lançamentos.
   * @returns Promise<{ success: boolean; message: string }>
   */
  async syncPendingLancamentos(userId: number): Promise<{ success: boolean; message: string }> {
    const pendingLancamentos = await this.getPendingLancamentos(userId);
    if (pendingLancamentos.length === 0) {
      return { success: true, message: 'Nenhum lançamento pendente para sincronizar.' };
    }

    console.log(`Sincronizando ${pendingLancamentos.length} lançamento(s) pendente(s)...`);

    // Importa a função da API dinamicamente para evitar dependência circular
    const { registrarEstatisticasLote } = await import('./api');

    for (const lancamento of pendingLancamentos) {
      try {
        // Remove o 'id' e 'timestamp' antes de enviar para a API
        const { id, timestamp, ...payload } = lancamento;
        await registrarEstatisticasLote(payload);
        await this.removePendingLancamento(id);
        console.log(`Lançamento ${id} sincronizado com sucesso.`);
      } catch (error) {
        console.error(`Falha ao sincronizar o lançamento ${lancamento.id}:`, error);
        await this.setLastSyncStatus('failed');
        // Decide o que fazer em caso de falha:
        // - Manter o item para tentar novamente mais tarde (comportamento atual)
        // - Marcar como 'falhou' e não tentar novamente
        // - Implementar um número máximo de tentativas
        return { 
          success: false, 
          message: `Falha ao sincronizar o lançamento ${lancamento.id}. A sincronização foi interrompida.` 
        };
      }
    }

    console.log('Sincronização concluída com sucesso.');
    await this.setLastSyncStatus('success');
    return { success: true, message: 'Todos os lançamentos pendentes foram sincronizados.' };
  },
};
