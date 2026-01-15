import { ReactElement } from 'react';
import { IPaginatedOcorrencias } from '../services/api';

// Interface das props (sem alteração)
interface PaginationProps {
  pagination: IPaginatedOcorrencias['pagination'];
  onPageChange: (newPage: number) => void;
}

function Pagination({ pagination, onPageChange }: PaginationProps): ReactElement | null {
  const { page, totalPages } = pagination;

  // Não renderiza nada se houver apenas uma página ou nenhuma
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="text-gray-400">
        Página {page} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Próxima
      </button>
    </div>
  );
}

export default Pagination;
