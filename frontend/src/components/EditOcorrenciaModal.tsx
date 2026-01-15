import React, { useState, useEffect, ReactElement } from 'react';
import { IOcorrencia, IDataApoio, getNaturezas, getCidades, ICidade } from '../services/api';

// Define a interface para as props do modal
interface EditOcorrenciaModalProps {
  ocorrencia: IOcorrencia | null;
  onClose: () => void;
  onSave: (ocorrencia: IOcorrencia) => void;
}

function EditOcorrenciaModal({ ocorrencia, onClose, onSave }: EditOcorrenciaModalProps): ReactElement | null {
  const [formData, setFormData] = useState<IOcorrencia | null>(ocorrencia);
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cidadesData, naturezasData] = await Promise.all([getCidades(), getNaturezas()]);
        setCidades(cidadesData);
        setNaturezas(naturezasData);
      } catch (error) {
        console.error("Erro ao buscar dados de apoio para o modal de ocorrência", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (formData) {
      // ======================= INÍCIO DA CORREÇÃO =======================
      // O nome do campo no formulário e na lógica agora é 'obm_id'
      const finalValue = (name === 'obm_id' || name === 'natureza_id') ? parseInt(value, 10) : value;
      // ======================= FIM DA CORREÇÃO =======================
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

  // Estilos (sem alteração)
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
                {naturezas.map(nat => <option key={nat.id} value={nat.id}>{nat.subgrupo}</option>)}
              </select>
            </div>
            {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
            <div style={styles.formGroup}>
              <label htmlFor="obm_id" style={styles.label}>OBM (Cidade)</label>
              <select id="obm_id" name="obm_id" value={formData?.obm_id} onChange={handleChange} required style={styles.input}>
                {cidades.map(cidade => (
                  <option key={cidade.id} value={cidade.id}>
                    {cidade.cidade_nome}
                  </option>
                ))}
              </select>
            </div>
            {/* ======================= FIM DA CORREÇÃO ======================= */}
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
