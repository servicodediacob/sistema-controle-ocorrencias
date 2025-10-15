// sistema-controle-ocorrencias/frontend/src/pages/EstatisticasExternasPage.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../services/api'; // Supondo que você tenha um serviço de API

// Defina as interfaces para os dados do dashboard, baseando-se no que a API do sisgpo retorna
interface DashboardData {
  totalMilitares: number;
  totalViaturas: number;
  // ... outras propriedades
}

const EstatisticasExternasPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/estatisticas-externas/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        setError('Não foi possível carregar as estatísticas externas.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard de Estatísticas Externas (SISGPO)</h1>
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Renderize os dados aqui. Exemplo: */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Total de Militares</h2>
            <p className="text-3xl">{dashboardData.totalMilitares}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Total de Viaturas</h2>
            <p className="text-3xl">{dashboardData.totalViaturas}</p>
          </div>
          {/* Adicione outros cards e gráficos conforme necessário */}
        </div>
      )}
    </div>
  );
};

export default EstatisticasExternasPage;