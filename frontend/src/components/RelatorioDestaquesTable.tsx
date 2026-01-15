// Caminho: frontend/src/components/RelatorioDestaquesTable.tsx

// ======================= INÍCIO DA CORREÇÃO =======================
// O tipo correto para um destaque é a própria ocorrência
import { IDestaqueRelatorio } from '../services/api';

interface Props {
  destaques: IDestaqueRelatorio[];
}
// ======================= FIM DA CORREÇÃO =======================

const RelatorioDestaquesTable = ({ destaques }: Props) => {
  if (destaques.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-strong mb-4">Ocorrências de Destaque</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
        <table className="min-w-full w-full border-collapse text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700 text-text-strong">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Natureza</th>
              <th className="p-3 text-left">OBM</th>
              <th className="p-3 text-left">CRBM</th>
            </tr>
          </thead>
          <tbody>
            {destaques.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-border/50">
                <td className="p-3 text-left">{item.id}</td>
                <td className="p-3 text-left whitespace-nowrap">{new Date(item.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="p-3 text-left">{item.natureza_descricao}</td>
                <td className="p-3 text-left">{item.obm_nome}</td>
                <td className="p-3 text-left">{item.crbm_nome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioDestaquesTable;
