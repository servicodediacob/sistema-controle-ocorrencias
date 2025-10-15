// frontend/src/pages/EstatisticasExternasPage.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../services/api'; // Certifique-se que o caminho está correto

// Interfaces para tipar os dados que virão da API do sisgpo
interface ViaturaPorObm {
  obm: string;
  total: number;
}

interface TipoDeViatura {
  tipo: string;
  total: number;
}

interface DashboardData {
  totalMilitares: number;
  totalViaturas: number;
  totalObms: number;
  viaturasPorObm: ViaturaPorObm[];
  tiposDeViatura: TipoDeViatura[];
}

const EstatisticasExternasPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Esta é a rota que criamos no backend do sistema-controle-ocorrencias
        const response = await api.get<DashboardData>('/estatisticas-externas/dashboard');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar os dados do SISGPO. Verifique se o sistema está online.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Carregando estatísticas externas...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="p-4 text-center">Nenhum dado para exibir.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Dashboard Externo <span className="font-light text-gray-500">(SISGPO)</span>
      </h1>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Total de Militares</h2>
          <p className="text-3xl font-bold text-blue-600">{data.totalMilitares}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Total de Viaturas</h2>
          <p className="text-3xl font-bold text-green-600">{data.totalViaturas}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Total de OBMs</h2>
          <p className="text-3xl font-bold text-purple-600">{data.totalObms}</p>
        </div>
      </div>

      {/* Tabelas de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4">Viaturas por OBM</h3>
          <ul className="space-y-2">
            {data.viaturasPorObm.map((item) => (
              <li key={item.obm} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">{item.obm}</span>
                <span className="font-bold bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">
                  {item.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4">Viaturas por Tipo</h3>
          <ul className="space-y-2">
            {data.tiposDeViatura.map((item) => (
              <li key={item.tipo} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">{item.tipo}</span>
                <span className="font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {item.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EstatisticasExternasPage;