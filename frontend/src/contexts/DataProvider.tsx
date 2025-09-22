import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';
// A importação do 'useAuth' foi removida, pois não é mais necessária aqui.

// Interface para o valor do contexto
interface IDataContext {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  loading: boolean;
  refetchData: () => void;
}

// Interface para as props do provedor
interface DataProviderProps {
  children: ReactNode;
}

// Criação do contexto
const DataContext = createContext<IDataContext | null>(null);

// Componente Provedor com a lógica corrigida
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // O estado de autenticação foi removido daqui.
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);

  // A função de busca agora não depende mais do status de autenticação.
  const fetchDadosDeApoio = useCallback(async () => {
    console.log('[DataProvider] Buscando dados de apoio...');
    setLoading(true);
    try {
      // Busca os dados em paralelo para otimizar o tempo de carregamento.
      const [cidadesData, naturezasData] = await Promise.all([
        getCidades(),
        getNaturezas(),
      ]);
      setCidades(cidadesData);
      setNaturezas(naturezasData);
    } catch (error) {
      console.error('Falha ao carregar dados de apoio globais:', error);
      // Em caso de erro, limpa os dados para evitar inconsistências.
      setCidades([]);
      setNaturezas([]);
    } finally {
      setLoading(false);
    }
  }, []); // A dependência 'isAuthenticated' foi removida.

  // O useEffect agora chama a função de busca uma única vez, no carregamento do componente.
  useEffect(() => {
    fetchDadosDeApoio();
  }, [fetchDadosDeApoio]);

  const value = {
    cidades,
    naturezas,
    loading,
    refetchData: fetchDadosDeApoio,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Hook para consumir o contexto (permanece igual)
export const useData = (): IDataContext => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
