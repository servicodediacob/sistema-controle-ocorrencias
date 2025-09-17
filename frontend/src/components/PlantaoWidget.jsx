import React, { useState, useEffect } from 'react';
import { getSupervisores, setSupervisorPlantao } from '../services/api';

function PlantaoWidget({ supervisor, onUpdate }) {
  const [supervisoresList, setSupervisoresList] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(supervisor?.usuario_id || '');

  useEffect(() => {
    const fetchSupervisores = async () => {
      try {
        const data = await getSupervisores();
        setSupervisoresList(data);
      } catch (error) {
        console.error("Falha ao buscar lista de supervisores", error);
      }
    };
    fetchSupervisores();
  }, []);
  
  useEffect(() => {
    // Sincroniza o select se o dado mudar externamente
    setSelectedSupervisor(supervisor?.usuario_id || '');
  }, [supervisor]);

  const handleSelectChange = async (e) => {
    const id = e.target.value === '' ? null : parseInt(e.target.value, 10);
    setSelectedSupervisor(e.target.value);
    try {
      await setSupervisorPlantao(id);
      onUpdate(); // Recarrega os dados no Dashboard
    } catch (error) {
      console.error("Falha ao definir supervisor de plantão", error);
      alert("Falha ao definir supervisor de plantão.");
    }
  };

  const styles = {
    widget: { backgroundColor: '#2c2c2c', padding: '1.5rem', borderRadius: '8px', flex: 1, minWidth: '300px' },
    title: { marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' },
    content: { marginTop: '1rem' },
    select: { width: '100%', padding: '0.75rem', backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white', borderRadius: '4px' },
  };

  return (
    <div style={styles.widget}>
      <h3 style={styles.title}>Supervisor de Plantão</h3>
      <div style={styles.content}>
        <p>
          <strong>Atual:</strong> {supervisor?.supervisor_nome || 'Nenhum supervisor definido'}
        </p>
        <select
          value={selectedSupervisor}
          onChange={handleSelectChange}
          style={styles.select}
        >
          <option value="">-- Selecione seu nome --</option>
          {supervisoresList.map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PlantaoWidget;
