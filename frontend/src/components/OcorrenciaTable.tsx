import { ReactElement } from 'react';
import { IOcorrencia } from '../services/api';
import Spinner from './Spinner';

interface OcorrenciaTableProps {
  ocorrencias: IOcorrencia[];
  loading: boolean;
  onEdit: (ocorrencia: IOcorrencia) => void;
  onDelete: (id: number) => void;
}

const OcorrenciaCard: React.FC<{ ocorrencia: IOcorrencia; onEdit: () => void; onDelete: () => void; }> = ({ ocorrencia, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm text-gray-400">ID: {ocorrencia.id}</p>
          <p className="font-bold">{ocorrencia.natureza_descricao}</p>
          {/* Este código agora está correto por causa da correção na interface */}
          <p className="text-sm text-gray-400">{ocorrencia.obm_nome}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold">{new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          {ocorrencia.quantidade_obitos > 0 && (
            <p className="text-sm font-bold text-red-400">
              {ocorrencia.quantidade_obitos} {ocorrencia.quantidade_obitos > 1 ? 'Óbitos' : 'Óbito'}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2 border-t border-gray-700 pt-4">
        <button onClick={onEdit} className="flex-1 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400">
          Editar
        </button>
        <button onClick={onDelete} className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
          Excluir
        </button>
      </div>
    </div>
  );
};

function OcorrenciaTable({ ocorrencias, loading, onEdit, onDelete }: OcorrenciaTableProps): ReactElement {
  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Spinner text="Carregando ocorrências..." />
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-700 md:block">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Natureza</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">OBM</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Óbitos</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {ocorrencias.length > 0 ? ocorrencias.map(ocorrencia => (
              <tr key={ocorrencia.id} className="hover:bg-gray-700/50">
                <td className="whitespace-nowrap px-6 py-4">{ocorrencia.id}</td>
                <td className="whitespace-nowrap px-6 py-4">{new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="whitespace-nowrap px-6 py-4">{ocorrencia.natureza_descricao}</td>
                {/* Este código agora está correto por causa da correção na interface */}
                <td className="whitespace-nowrap px-6 py-4">{ocorrencia.obm_nome}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center">{ocorrencia.quantidade_obitos}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => onEdit(ocorrencia)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-yellow-400">Editar</button>
                    <button onClick={() => onDelete(ocorrencia.id)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700">Excluir</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhuma ocorrência encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {ocorrencias.length > 0 ? (
          ocorrencias.map(ocorrencia => (
            <OcorrenciaCard
              key={ocorrencia.id}
              ocorrencia={ocorrencia}
              onEdit={() => onEdit(ocorrencia)}
              onDelete={() => onDelete(ocorrencia.id)}
            />
          ))
        ) : (
          !loading && <p className="py-10 text-center text-gray-500">Nenhuma ocorrência encontrada.</p>
        )}
      </div>
    </>
  );
}

export default OcorrenciaTable;
