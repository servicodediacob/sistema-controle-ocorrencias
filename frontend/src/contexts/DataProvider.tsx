// frontend/src/contexts/DataProvider.tsx

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';
import { useAuth } from './useAuth'; // 1. Importe o hook de autenticação

// Interfaces (sem alteração)
interface IDataContext {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  loading: boolean;
  refetchData: () => void;
}

interface DataProviderProps {
  children: ReactNode;
}

// Contexto (sem alteração)
const DataContext = createContext<IDataContext | null>(null);

// Provedor (COM A CORREÇÃO)
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // 2. Obtenha o estado de autenticação
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDadosDeApoio = useCallback(async () => {
    // 3. VERIFICAÇÃO CRÍTICA: Só busca os dados se o usuário estiver autenticado
    if (!isAuthenticated) {
      setLoading(false); // Se não está autenticado, não há nada para carregar
      return;
    }

    console.log('[DataProvider] Usuário autenticado. Buscando dados de apoio...');
    setLoading(true);
    try {
      // O Promise.all busca os dados em paralelo
      const [cidadesData, naturezasData] = await Promise.all([
        getCidades(),
        getNaturezas(),
      ]);
      setCidades(cidadesData);
      setNaturezas(naturezasData);
    } catch (error) {
      // Este erro agora é esperado se o token expirar, por exemplo.
      console.error('Falha ao carregar dados de apoio globais:', error);
      // Em caso de erro (ex: token expirado), limpa os dados para evitar inconsistências
      setCidades([]);
      setNaturezas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // 4. Adicione 'isAuthenticated' como dependência do useCallback

  useEffect(() => {
    fetchDadosDeApoio();
  }, [fetchDadosDeApoio]); // 5. O useEffect agora depende da função que depende do 'isAuthenticated'

  const value = {
    cidades,
    naturezas,
    loading,
    refetchData: fetchDadosDeApoio,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Hook (sem alteração)
export const useData = (): IDataContext => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
