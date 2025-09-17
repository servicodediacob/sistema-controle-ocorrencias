import React from 'react';

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) {
    return null; // Não renderiza nada se houver apenas uma página
  }

  const styles = {
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '2rem',
      gap: '0.5rem',
    },
    button: {
      padding: '0.5rem 1rem',
      border: '1px solid #555',
      borderRadius: '4px',
      backgroundColor: '#3a3a3a',
      color: 'white',
      cursor: 'pointer',
    },
    buttonDisabled: {
      backgroundColor: '#2c2c2c',
      color: '#666',
      cursor: 'not-allowed',
    },
    pageInfo: {
      margin: '0 1rem',
    },
  };

  return (
    <div style={styles.paginationContainer}>
      <button
        style={page === 1 ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </button>
      <span style={styles.pageInfo}>
        Página {page} de {totalPages}
      </span>
      <button
        style={page === totalPages ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Próxima
      </button>
    </div>
  );
}

export default Pagination;
