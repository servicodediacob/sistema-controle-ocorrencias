import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { getDashboardStats, getPlantao } from '../services/api';
import { useNavigate } from 'react-router-dom';
import DestaqueWidget from '../components/DestaqueWidget';
import PlantaoWidget from '../components/PlantaoWidget';

// --- Componentes Internos (para manter o arquivo autocontido) ---

function StatCard({ title, value, loading }) {
  const styles = {
    card: { backgroundColor: '#2c2c2c', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', flex: 1, minWidth: '200px' },
    title: { fontSize: '1rem', color: '#aaa', margin: 0 },
    value: { fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' },
  };
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.value}>{loading ? '...' : value}</p>
    </div>
  );
}

function DataTable({ title, data, columns, loading }) {
  const styles = {
    tableContainer: { backgroundColor: '#2c2c2c', borderRadius: '8px', padding: '1.5rem', flex: 1, minWidth: '300px' },
    title: { marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    emptyState: { textAlign: 'center', padding: '2rem', color: '#888' },
  };

  return (
    <div style={styles.tableContainer}>
      <h3 style={styles.title}>{title}</h3>
      {loading ? (
        <p>Carregando...</p>
      ) : data && data.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={styles.th}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={styles.emptyState}>Nenhum dado para exibir.</p>
      )}
    </div>
  );
}


// --- Componente Principal da Página ---

function DashboardPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [plantaoData, setPlantaoData] = useState({ ocorrenciaDestaque: null, supervisorPlantao: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, plantaoInfo] = await Promise.all([
        getDashboardStats(),
        getPlantao()
      ]);
      setStats(statsData);
      setPlantaoData(plantaoInfo);
    } catch (err) {
      console.error("Falha ao buscar dados do dashboard:", err);
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem' },
    main: { marginTop: '2rem' },
    button: { padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '4px' },
    logoutButton: { marginLeft: '1rem', backgroundColor: '#555', color: 'white' },
    manageButton: { backgroundColor: '#3a7ca5', color: 'white' },
    widgetsContainer: { display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' },
    cardsContainer: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
    tablesContainer: { display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' },
    error: { color: 'red', marginTop: '1rem' },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Dashboard do Supervisor</h1>
        <div>
          <span>Olá, {usuario?.nome}</span>
          <button onClick={logout} style={{...styles.button, ...styles.logoutButton}}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <p style={styles.error}>{error}</p>}

        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/gestao-ocorrencias')} style={{...styles.button, ...styles.manageButton}}>
            Gerenciar Ocorrências
          </button>
        </div>

        <div style={styles.widgetsContainer}>
          <DestaqueWidget destaque={plantaoData.ocorrenciaDestaque} onUpdate={fetchData} />
          <PlantaoWidget supervisor={plantaoData.supervisorPlantao} onUpdate={fetchData} />
        </div>

        <div style={{...styles.cardsContainer, marginTop: '2rem'}}>
          <StatCard title="Total de Ocorrências" value={stats?.totalOcorrencias ?? 0} loading={loading} />
          <StatCard title="Total de Óbitos" value={stats?.totalObitos ?? 0} loading={loading} />
        </div>

        <div style={styles.tablesContainer}>
          <DataTable
            title="Ocorrências por Natureza"
            loading={loading}
            data={stats?.ocorrenciasPorNatureza}
            columns={[{ header: 'Natureza', key: 'nome' }, { header: 'Total', key: 'total' }]}
          />
          <DataTable
            title="Ocorrências por OBM"
            loading={loading}
            data={stats?.ocorrenciasPorOBM}
            columns={[{ header: 'OBM', key: 'nome' }, { header: 'Total', key: 'total' }]}
          />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
