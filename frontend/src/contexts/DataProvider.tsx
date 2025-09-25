// Caminho: frontend/src/contexts/DataProvider.tsx

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';
import { useAuth } from './useAuth'; // O hook para obter o estado de autenticação

// --- Interfaces e Contexto (sem alterações) ---
interface IDataContext {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  loading: boolean;
  refetchData: () => void;
}

interface DataProviderProps {
  children: ReactNode;
}

const DataContext = createContext<IDataContext | null>(null);

// --- Componente Provedor (COM A CORREÇÃO) ---
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // 1. Obtém o estado de autenticação, incluindo se o usuário está logado.
  const { isAuthenticated } = useAuth(); 
  
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(false); // Inicia como false

  // 2. A função de busca de dados agora é um 'useCallback' que depende de 'isAuthenticated'.
  //    Ela só será executada se o usuário estiver autenticado.
  const fetchDadosDeApoio = useCallback(async () => {
    // Se não estiver autenticado, não faz nada.
    if (!isAuthenticated) {
      console.log('[DataProvider] Usuário não autenticado. Nenhuma busca de dados será feita.');
      setCidades([]); // Limpa os dados se o usuário deslogar
      setNaturezas([]);
      return;
    }

    console.log('[DataProvider] Usuário autenticado. Buscando dados de apoio...');
    setLoading(true);
    try {
      // Busca os dados em paralelo
      const [cidadesData, naturezasData] = await Promise.all([
        getCidades(),
        getNaturezas(),
      ]);
      setCidades(cidadesData);
      setNaturezas(naturezasData);
    } catch (error) {
      console.error('Falha ao carregar dados de apoio globais:', error);
      // Em caso de erro, limpa os estados para evitar dados inconsistentes
      setCidades([]);
      setNaturezas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // A dependência chave é 'isAuthenticated'

  // 3. O 'useEffect' agora executa a função de busca sempre que o status de autenticação mudar.
  useEffect(() => {
    fetchDadosDeApoio();
  }, [fetchDadosDeApoio]);

  const value = {
    cidades,
    naturezas,
    loading,
    refetchData: fetchDadosDeApoio,
  };

  // O DataProvider agora simplesmente renderiza seus filhos, sem uma tela de loading própria,
  // pois a busca de dados só acontece após a autenticação.
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// --- Hook (sem alterações) ---
export const useData = (): IDataContext => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
