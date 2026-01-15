// frontend/src/components/OcorrenciaTable.tsx

import { ReactElement } from 'react';
import { IOcorrencia } from '../services/api';

// ESTE COMPONENTE RECEBE AS PROPS
interface OcorrenciaTableProps {
  ocorrencias: IOcorrencia[];
  loading: boolean;
  onEdit: (ocorrencia: IOcorrencia) => void;
  onDelete: (id: number) => void;
}

function OcorrenciaTable({ ocorrencias, loading, onEdit, onDelete }: OcorrenciaTableProps): ReactElement {
  const styles: { [key: string]: React.CSSProperties } = {
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '2rem' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    actionButtons: { display: 'flex', gap: '0.5rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    loadingRow: { textAlign: 'center', color: '#888' },
  };

  if (loading) {
    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Natureza</th>
            <th style={styles.th}>OBM</th>
            <th style={styles.th}>Óbitos</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={6} style={styles.loadingRow}>Carregando ocorrências...</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Data</th>
          <th style={styles.th}>Natureza</th>
          <th style={styles.th}>OBM</th>
          <th style={styles.th}>Óbitos</th>
          <th style={styles.th}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {ocorrencias.map(ocorrencia => (
          <tr key={ocorrencia.id}>
            <td style={styles.td}>{ocorrencia.id}</td>
            <td style={styles.td}>{new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
            <td style={styles.td}>{ocorrencia.natureza_descricao}</td>
            <td style={styles.td}>{ocorrencia.obm_nome}</td>
            <td style={styles.td}>{ocorrencia.quantidade_obitos}</td>
            <td style={styles.td}>
              <div style={styles.actionButtons}>
                <button onClick={() => onEdit(ocorrencia)} style={{...styles.button, backgroundColor: '#e9c46a', color: 'black'}}>Editar</button>
                <button onClick={() => onDelete(ocorrencia.id)} style={{...styles.button, backgroundColor: '#e76f51'}}>Excluir</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default OcorrenciaTable;
