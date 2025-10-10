// frontend/src/components/SkeletonTable.tsx

import React from 'react';

// 1. Definindo a interface para aceitar a prop data-testid
interface SkeletonTableProps {
  'data-testid'?: string;
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({ 'data-testid': dataTestId }) => {
  return (
    // 2. Aplicando a prop na div principal do componente
    <div data-testid={dataTestId} className="animate-pulse p-4 border border-border rounded-lg">
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full mb-4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
      </div>
    </div>
  );
};

export default SkeletonTable;
