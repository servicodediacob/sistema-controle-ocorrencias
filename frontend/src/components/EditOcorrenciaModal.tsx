// frontend/src/components/EditOcorrenciaModal.tsx

import React, { useState, useEffect, ReactElement } from 'react';
import { IOcorrencia, IDataApoio, getObms, getNaturezas } from '../services/api';

// 1. Define a interface para as props do modal
interface EditOcorrenciaModalProps {
  ocorrencia: IOcorrencia | null;
  onClose: () => void;
  onSave: (ocorrencia: IOcorrencia) => void;
}

function EditOcorrenciaModal({ ocorrencia, onClose, onSave }: EditOcorrenciaModalProps): ReactElement | null {
  // 2. Tipos para os estados
  const [formData, setFormData] = useState<IOcorrencia | null>(ocorrencia);
  const [obms, setObms] = useState<IDataApoio[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [obmsData, naturezasData] = await Promise.all([getObms(), getNaturezas()]);
        setObms(obmsData);
        setNaturezas(naturezasData);
      } catch (error) {
        console.error("Erro ao buscar dados de apoio para o modal", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. Tipos para os eventos de change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (formData) {
      // Converte para número se for um dos IDs
      const finalValue = (name === 'obm_id' || name === 'natureza_id') ? parseInt(value, 10) : value;
      setFormData({ ...formData, [name]: finalValue });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  if (!ocorrencia) {
    return null;
  }

  const styles: { [key: string]: React.CSSProperties } = {
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#2c2c2c', padding: '2rem', borderRadius: '8px', width: '450px', color: 'white' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#3a3a3a', color: 'white' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>Editar Ocorrência #{ocorrencia.id}</h2>
        {loading ? <p>Carregando dados de apoio...</p> : (
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="data_ocorrencia" style={styles.label}>Data da Ocorrência</label>
              {/* Formata a data para o formato YYYY-MM-DD esperado pelo input type="date" */}
              <input
                type="date"
                id="data_ocorrencia"
                name="data_ocorrencia"
                value={formData?.data_ocorrencia.split('T')[0] || ''}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="natureza_id" style={styles.label}>Natureza</label>
              <select id="natureza_id" name="natureza_id" value={formData?.natureza_id} onChange={handleChange} required style={styles.input}>
                {naturezas.map(nat => <option key={nat.id} value={nat.id}>{nat.descricao}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="obm_id" style={styles.label}>OBM</label>
              <select id="obm_id" name="obm_id" value={formData?.obm_id} onChange={handleChange} required style={styles.input}>
                {obms.map(obm => <option key={obm.id} value={obm.id}>{obm.nome}</option>)}
              </select>
            </div>
            <div style={styles.buttonContainer}>
              <button type="button" onClick={onClose} style={{...styles.button, backgroundColor: '#555'}}>Cancelar</button>
              <button type="submit" style={{...styles.button, backgroundColor: '#3a7ca5'}}>Salvar Alterações</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditOcorrenciaModal;
