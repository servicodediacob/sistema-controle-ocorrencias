import React from 'react';

function OcorrenciaTable({ ocorrencias, onEdit, onDelete, loading }) {
  const styles = {
    tableContainer: { backgroundColor: '#2c2c2c', borderRadius: '8px', padding: '1.5rem', marginTop: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { borderBottom: '1px solid #555', padding: '0.75rem', textAlign: 'left', color: '#aaa' },
    td: { borderBottom: '1px solid #3a3a3a', padding: '0.75rem' },
    actionButton: {
      padding: '0.4rem 0.8rem',
      marginRight: '0.5rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    editButton: {
      backgroundColor: '#3a7ca5',
      color: 'white',
    },
    deleteButton: {
      backgroundColor: '#d9534f',
      color: 'white',
    },
    emptyState: { textAlign: 'center', padding: '2rem', color: '#888' },
  };

  // Formata a data para o padrão brasileiro (dd/mm/yyyy)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
  };

  if (loading) {
    return <p>Carregando ocorrências...</p>;
  }

  if (!ocorrencias || ocorrencias.length === 0) {
    return <p style={styles.emptyState}>Nenhuma ocorrência encontrada.</p>;
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Natureza</th>
            <th style={styles.th}>OBM</th>
            <th style={styles.th}>CRBM</th>
            <th style={styles.th}>Óbitos</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {ocorrencias.map((ocorrencia) => (
            <tr key={ocorrencia.id}>
              <td style={styles.td}>{formatDate(ocorrencia.data_ocorrencia)}</td>
              <td style={styles.td}>{ocorrencia.natureza_descricao}</td>
              <td style={styles.td}>{ocorrencia.obm_nome}</td>
              <td style={styles.td}>{ocorrencia.crbm_nome}</td>
              <td style={styles.td}>{ocorrencia.quantidade_obitos}</td>
              <td style={styles.td}>
                <button
                  style={{ ...styles.actionButton, ...styles.editButton }}
                  onClick={() => onEdit(ocorrencia)}
                >
                  Editar
                </button>
                <button
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                  onClick={() => onDelete(ocorrencia.id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OcorrenciaTable;
