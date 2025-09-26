// Caminho: frontend/src/components/RelatorioObitosTable.tsx

// ======================= INÍCIO DA CORREÇÃO =======================
// Corrigido o nome da interface para IObitoRegistro
import { IObitoRegistro } from '../services/api';
// ======================= FIM DA CORREÇÃO =======================

interface Props {
  obitos: IObitoRegistro[];
}

const RelatorioObitosTable = ({ obitos }: Props) => {
  if (obitos.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-strong mb-4">Relatório de Óbitos</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface text-text">
        <table className="min-w-full w-full border-collapse text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700 text-text-strong">
            <tr>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Natureza</th>
              <th className="p-3 text-left">RAI</th>
              <th className="p-3 text-left">OBM Responsável</th>
              <th className="p-3 text-center">Vítimas</th>
            </tr>
          </thead>
          <tbody>
            {obitos.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-border/50">
                <td className="p-3 text-left whitespace-nowrap">{new Date(item.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="p-3 text-left">{item.natureza_nome}</td>
                <td className="p-3 text-left">{item.numero_ocorrencia}</td>
                <td className="p-3 text-left">{item.obm_nome}</td>
                <td className="p-3 text-center">{item.quantidade_vitimas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioObitosTable;
