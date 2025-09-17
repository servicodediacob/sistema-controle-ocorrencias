import React, { useState, useEffect } from 'react';
import { getObms, getNaturezas } from '../services/api';

function EditOcorrenciaModal({ ocorrencia, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...ocorrencia });
  const [obms, setObms] = useState([]);
  const [naturezas, setNaturezas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega os dados de apoio (OBMs e Naturezas) para os dropdowns
    const loadSupportingData = async () => {
      try {
        const [obmsData, naturezasData] = await Promise.all([getObms(), getNaturezas()]);
        setObms(obmsData);
        setNaturezas(naturezasData);
      } catch (error) {
        console.error("Erro ao carregar dados de apoio para o modal", error);
      } finally {
        setLoading(false);
      }
    };
    loadSupportingData();
  }, []);

  // Atualiza o estado do formulário quando o usuário digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Chama a função onSave passada pelo componente pai
  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Formata a data para o formato YYYY-MM-DD, exigido pelo input type="date"
  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#2c2c2c', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', color: 'white' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeButton: { background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' },
    input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#3a3a3a', color: 'white' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' },
    button: { padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    saveButton: { backgroundColor: '#3a7ca5', color: 'white' },
    cancelButton: { backgroundColor: '#555', color: 'white' },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2>Editar Ocorrência</h2>
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>
        {loading ? <p>Carregando...</p> : (
          <form onSubmit={handleSave} style={styles.form}>
            <label>Data da Ocorrência</label>
            <input
              type="date"
              name="data_ocorrencia"
              value={formatDateForInput(formData.data_ocorrencia)}
              onChange={handleChange}
              style={styles.input}
              required
            />
            <label>Natureza</label>
            <select name="natureza_id" value={formData.natureza_id} onChange={handleChange} style={styles.input} required>
              {naturezas.map(nat => <option key={nat.id} value={nat.id}>{nat.descricao}</option>)}
            </select>
            <label>OBM</label>
            <select name="obm_id" value={formData.obm_id} onChange={handleChange} style={styles.input} required>
              {obms.map(obm => <option key={obm.id} value={obm.id}>{obm.nome}</option>)}
            </select>
            <div style={styles.buttonContainer}>
              <button type="button" onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancelar</button>
              <button type="submit" style={{...styles.button, ...styles.saveButton}}>Salvar Alterações</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditOcorrenciaModal;
