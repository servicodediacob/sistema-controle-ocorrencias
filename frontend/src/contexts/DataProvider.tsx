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

  const fetchData = useCallback(async () => {
    if (authLoading) {
      return;
    }

    setLoading(true);
    try {
      const [cidadesResponse, naturezasResponse] = await Promise.all([
        getCidades(),
        getNaturezas()
      ]);
      
      if (Array.isArray(cidadesResponse)) {
        setCidades(cidadesResponse);
      } else {
        throw new Error('A resposta da API de cidades não é um array válido.');
      }

      if (Array.isArray(naturezasResponse)) {
        setNaturezas(naturezasResponse);
      } else {
        throw new Error('A resposta da API de naturezas não é um array válido.');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido.';
      setError(errorMessage);
      console.error('[DataProvider] FALHA CRÍTICA ao buscar dados:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, triggerRefetch]); // Adiciona triggerRefetch como dependência

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
