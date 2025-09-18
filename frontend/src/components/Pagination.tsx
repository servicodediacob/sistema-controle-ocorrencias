import { ReactElement } from 'react';
import styled from 'styled-components';
import { IPaginatedOcorrencias } from '../services/api';

// --- Styled Components ---
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 1px solid #555;
  background-color: #2c2c2c;
  color: white;
  border-radius: 4px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PageInfo = styled.span`
  color: #aaa;
`;

// --- Component ---
interface PaginationProps {
  pagination: IPaginatedOcorrencias['pagination'];
  onPageChange: (newPage: number) => void;
}

function Pagination({ pagination, onPageChange }: PaginationProps): ReactElement | null {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Container>
      <PageButton
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </PageButton>
      <PageInfo>
        Página {page} de {totalPages}
      </PageInfo>
      <PageButton
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Próxima
      </PageButton>
    </Container>
  );
}

export default Pagination;
