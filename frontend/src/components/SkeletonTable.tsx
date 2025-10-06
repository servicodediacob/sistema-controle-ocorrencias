// Caminho: frontend/src/components/SkeletonTable.tsx

import React from 'react';

// Componente para uma única linha do esqueleto
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-3">
      <div className="h-4 rounded bg-gray-700"></div>
    </td>
    <td className="p-3">
      <div className="h-4 rounded bg-gray-700"></div>
    </td>
    {/* Repete as células de dados para simular as colunas de natureza */}
    {Array.from({ length: 18 }).map((_, i) => (
      <td key={i} className="hidden p-3 lg:table-cell">
        <div className="h-4 rounded bg-gray-700"></div>
      </td>
    ))}
    <td className="p-3 lg:hidden">
      <div className="h-4 rounded bg-gray-700"></div>
    </td>
    <td className="p-3">
      <div className="h-4 rounded bg-gray-700"></div>
    </td>
    <td className="p-3">
      <div className="h-4 rounded bg-gray-700"></div>
    </td>
  </tr>
);

// Componente principal do esqueleto da tabela
const SkeletonTable = () => {
  return (
    <div className="mt-8 hidden rounded-lg border border-border bg-surface text-text md:block overflow-x-auto">
      <table className="min-w-[1300px] w-full border-collapse table-fixed">
        {/* Cabeçalho Fixo */}
        <thead className="bg-gray-700 text-white">
          <tr>
            <th className="sticky left-0 top-0 z-30 w-[150px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">CRBM</th>
            <th className="sticky left-[150px] top-0 z-30 w-[250px] border-b border-r border-gray-600 bg-surface p-3 text-left font-bold uppercase text-text-strong">Quartel / Cidade</th>
            {/* Cabeçalhos das naturezas */}
            {Array.from({ length: 17 }).map((_, i) => (
              <th key={i} className="sticky top-0 z-20 border-b border-x border-gray-700 bg-gray-700 p-3 text-center uppercase">
                <div className="h-4 w-12 mx-auto rounded bg-gray-600 animate-pulse"></div>
              </th>
            ))}
            <th className="sticky right-0 top-0 z-30 border-b border-l border-gray-700 bg-blue-900 p-3 text-center font-bold uppercase">TOTAL</th>
            <th className="sticky right-0 top-0 z-30 border-b border-l border-gray-700 bg-gray-700 p-3 text-center uppercase">AÇÕES</th>
          </tr>
        </thead>
        {/* Corpo com linhas de esqueleto */}
        <tbody className="bg-surface">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonTable;
