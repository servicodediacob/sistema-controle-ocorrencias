import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';
import { useAuth } from './useAuth';

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
  const { isAuthenticated } = useAuth();
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true); // Inicia como true

  const fetchDadosDeApoio = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    console.log('[DataProvider] Usuário autenticado. Buscando dados de apoio...');
    setLoading(true); // Garante que o loading seja true no início da busca
    try {
      const [cidadesData, naturezasData] = await Promise.all([
        getCidades(),
        getNaturezas(),
      ]);
      setCidades(cidadesData);
      setNaturezas(naturezasData);
    } catch (error) {
      console.error('Falha ao carregar dados de apoio globais:', error);
      setCidades([]);
      setNaturezas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDadosDeApoio();
  }, [fetchDadosDeApoio]);

  const value = {
    cidades,
    naturezas,
    loading,
    refetchData: fetchDadosDeApoio,
  };

  // ======================= INÍCIO DA CORREÇÃO =======================
  // Enquanto os dados essenciais estiverem carregando, exibimos uma tela de loading
  // em vez de tentar renderizar os componentes filhos com dados vazios.
  // Isso impede que os componentes que dependem desses dados quebrem durante a inicialização.
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a202c',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        Carregando dados essenciais...
      </div>
    );
  }
  // ======================= FIM DA CORREÇÃO =======================

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
