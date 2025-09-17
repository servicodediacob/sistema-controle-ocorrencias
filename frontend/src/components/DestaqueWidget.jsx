import React, { useState } from 'react';
import { setOcorrenciaDestaque } from '../services/api';

function DestaqueWidget({ destaque, onUpdate }) {
  const [ocorrenciaIdInput, setOcorrenciaIdInput] = useState('');
  const [error, setError] = useState('');

  const handleDefinirDestaque = async () => {
    const id = ocorrenciaIdInput.trim() === '' ? null : parseInt(ocorrenciaIdInput, 10);
    if (isNaN(id) && id !== null) {
      setError('Por favor, insira um ID de ocorrência válido.');
      return;
    }
    setError('');
    try {
      await setOcorrenciaDestaque(id);
      onUpdate(); // Chama a função para recarregar os dados no Dashboard
      setOcorrenciaIdInput('');
    } catch (err) {
      setError(err.message || 'Falha ao definir destaque.');
    }
  };

  const styles = {
    widget: { backgroundColor: '#2c2c2c', padding: '1.5rem', borderRadius: '8px', flex: 1, minWidth: '300px' },
    title: { marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' },
    content: { marginTop: '1rem' },
    destaqueInfo: { background: '#3a3a3a', padding: '1rem', borderRadius: '4px' },
    inputGroup: { display: 'flex', gap: '0.5rem', marginTop: '1rem' },
    input: { flex: 1, padding: '0.5rem', backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white', borderRadius: '4px' },
    button: { padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#3a7ca5', color: 'white' },
    error: { color: '#d9534f', fontSize: '0.8rem', marginTop: '0.5rem' },
  };

  return (
    <div style={styles.widget}>
      <h3 style={styles.title}>Ocorrência de Destaque</h3>
      <div style={styles.content}>
        {destaque && destaque.ocorrencia_id ? (
          <div style={styles.destaqueInfo}>
            <p><strong>ID:</strong> {destaque.ocorrencia_id}</p>
            <p><strong>Natureza:</strong> {destaque.natureza_descricao}</p>
            <p><strong>OBM:</strong> {destaque.obm_nome}</p>
          </div>
        ) : (
          <p>Nenhuma ocorrência em destaque.</p>
        )}
        <div style={styles.inputGroup}>
          <input
            type="number"
            placeholder="ID da Ocorrência"
            value={ocorrenciaIdInput}
            onChange={(e) => setOcorrenciaIdInput(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleDefinirDestaque} style={styles.button}>Definir</button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

export default DestaqueWidget;
