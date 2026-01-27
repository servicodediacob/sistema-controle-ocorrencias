// frontend/src/contexts/DataProvider.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';
import { useAuth } from './AuthProvider'; // << IMPORTANTE: Importando o hook de autenticação

interface DataContextType {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  triggerDataRefetch: () => void; // Nova função para forçar re-fetch
}

const DataContext = createContext<DataContextType>({
  cidades: [],
  naturezas: [],
  loading: true,
  error: null,
  refetch: () => {},
  triggerDataRefetch: () => {},
});

export const useData = () => useContext(DataContext);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0); // Estado para forçar re-fetch

  const isAbortError = (err: any) =>
    err?.name === 'AbortError' || String(err?.message || '').includes('AbortError');

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const withRetry = async <T,>(fn: () => Promise<T>, attempts = 2): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (isAbortError(err) && i < attempts - 1) {
          await delay(300);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  const fetchData = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }


    setLoading(true);
    setError(null);
    try {
      const cidadesResponse = await withRetry(getCidades);
      const naturezasResponse = await withRetry(getNaturezas);

      if (Array.isArray(cidadesResponse)) {
        setCidades(cidadesResponse);
      } else {
        throw new Error('A resposta da API de cidades nao e um array valido.');
      }

      if (Array.isArray(naturezasResponse)) {
        setNaturezas(naturezasResponse);
      } else {
        throw new Error('A resposta da API de naturezas nao e um array valido.');
      }
    } catch (err: any) {
      if (isAbortError(err)) {
        console.warn('[DataProvider] Requisicao abortada ao buscar dados. Tentaremos novamente.');
        return;
      }

      const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido.';
      setError(errorMessage);
      console.error('[DataProvider] FALHA CRITICA ao buscar dados:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, triggerRefetch]); // Adiciona triggerRefetch como dependencia

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerDataRefetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  const value = { cidades, naturezas, loading, error, refetch: fetchData, triggerDataRefetch };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};