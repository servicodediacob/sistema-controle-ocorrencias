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
}

const DataContext = createContext<DataContextType>({
  cidades: [],
  naturezas: [],
  loading: true,
  error: null,
  refetch: () => {},
});

export const useData = () => useContext(DataContext);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // << OBTENDO O ESTADO DE AUTENTICAÇÃO

  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // << CONDIÇÃO DE GUARDA: Só executa se a autenticação estiver concluída e houver um usuário >>
    if (authLoading || !user) {
      // Se não há usuário ou a autenticação está em progresso, não faz nada.
      // Se não houver usuário no final, o loading será definido como false no 'finally'.
      if (!authLoading && !user) {
          setLoading(false);
      }
      return;
    }

    setLoading(true); // Garante que o loading seja ativado antes da busca
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
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = { cidades, naturezas, loading, error, refetch: fetchData };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
