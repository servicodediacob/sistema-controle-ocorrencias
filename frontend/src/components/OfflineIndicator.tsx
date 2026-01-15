
// Caminho: frontend/src/components/OfflineIndicator.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus'; // Hook que criaremos a seguir
import { useAuth } from '../contexts/AuthProvider';
import Icon from './Icon'; // Supondo que você tenha um componente de ícone
import { ICONS } from './icons';

const OfflineIndicator: React.FC = () => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSync, setLastSync] = useState<{ timestamp: string; status: string } | null>(null);

  const updatePendingCount = useCallback(async () => {
    if (user) {
      const lancamentos = await offlineSyncService.getPendingLancamentos(user.id);
      setPendingCount(lancamentos.length);
    }
  }, [user]);

  const fetchLastSync = useCallback(async () => {
    const lastSyncStatus = await offlineSyncService.getLastSyncStatus();
    setLastSync(lastSyncStatus);
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncing || !user) return;
    setIsSyncing(true);
    setMessage('Sincronizando dados...');
    try {
      const result = await offlineSyncService.syncPendingLancamentos(user.id);
      setMessage(result.message);
      await updatePendingCount();
    } catch (error) {
      setMessage('Ocorreu um erro durante a sincronização.');
      console.error(error);
    } finally {
      setIsSyncing(false);
      // Esconde a mensagem após alguns segundos
      setTimeout(() => setMessage(''), 5000);
    }
  }, [isSyncing, updatePendingCount, user]);

  useEffect(() => {
    updatePendingCount();
    fetchLastSync();
    // Adiciona um listener para o evento 'storage' para atualizar a contagem
    // se outra aba modificar o localforage.
    const handleStorageChange = () => {
      updatePendingCount();
      fetchLastSync();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updatePendingCount, fetchLastSync]);



  if (!isOnline && pendingCount === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg flex items-center">
        <Icon path={ICONS['wifi-off']} className="mr-2" />
        <span>Você está offline.</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg flex flex-col items-start ${isOnline ? 'bg-blue-500' : 'bg-gray-700'} text-white`}>
        <div className="flex items-center mb-2">
          <Icon path={isOnline ? ICONS['cloud-sync'] : ICONS['cloud-off']} className="mr-2" />
          <span>
            {isOnline ? `${pendingCount} lançamento(s) pendente(s).` : `Offline com ${pendingCount} lançamento(s) pendente(s).`}
          </span>
        </div>
        {isOnline && (
          <button
            onClick={handleSync}
            disabled={isSyncing || pendingCount === 0}
            className="bg-white text-blue-500 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        )}
        {message && <p className="text-sm mt-2">{message}</p>}
        {lastSync && (
          <p className="text-xs mt-2 opacity-70">
            Última sincronização: {new Date(lastSync.timestamp).toLocaleString()} ({lastSync.status})
          </p>
        )}
      </div>
    );
  }

  return null; // Não mostra nada se estiver online e sem pendências
};

export default OfflineIndicator;
