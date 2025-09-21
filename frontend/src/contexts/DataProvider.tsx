// Caminho: frontend/src/contexts/DataProvider.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCidades, getNaturezas, ICidade, IDataApoio } from '../services/api';

// 1. Definir a interface para o valor do contexto
interface IDataContext {
  cidades: ICidade[];
  naturezas: IDataApoio[];
  loading: boolean;
  error: string | null;
}

// 2. Criar o Contexto
const DataContext = createContext<IDataContext | null>(null);

// 3. Criar o Provedor
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDadosDeApoio = async () => {
      try {
        // Busca os dados apenas uma vez
        const [cidadesData, naturezasData] = await Promise.all([
          getCidades(),
          getNaturezas(),
        ]);
        setCidades(cidadesData);
        setNaturezas(naturezasData);
      } catch (err) {
        console.error("Falha ao carregar dados de apoio globais:", err);
        setError("Não foi possível carregar os dados essenciais do sistema.");
      } finally {
        setLoading(false);
      }
    };

    fetchDadosDeApoio();
  }, []); // O array de dependências vazio [] garante que isso rode só uma vez

  const value = { cidades, naturezas, loading, error };

  // Exibe uma mensagem de carregamento global enquanto os dados essenciais não chegam
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Carregando dados essenciais do sistema...</div>;
  }
  
  if (error) {
     return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// 4. Criar o Hook customizado para usar o contexto
export const useData = (): IDataContext => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
