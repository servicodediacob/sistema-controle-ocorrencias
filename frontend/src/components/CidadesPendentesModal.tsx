// frontend/src/components/CidadesPendentesModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { getObmsPendentesPorIntervalo as getObmsPendentesPorData } from '../services/api'; // Assuming this will be added to api.ts
import { useNotification } from '../contexts/NotificationContext';
import Spinner from './Spinner';

interface CidadesPendentesModalProps {
  onClose: () => void;
  dataHoraInicial: string;
  dataHoraFinal: string;
}

interface PendingObm {
  id: number;
  cidade_nome: string;
  crbm_nome: string;
}

import { ChevronDown, ChevronUp } from 'lucide-react'; // Import icons

const CidadesPendentesModal: React.FC<CidadesPendentesModalProps> = ({ onClose, dataHoraInicial, dataHoraFinal }) => {
  const [pendingObms, setPendingObms] = useState<IPendingObm[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();
  const [openCrbmGroups, setOpenCrbmGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPendingObms = async () => {
      setLoading(true);
      try {
        const response = await getObmsPendentesPorData(dataHoraInicial, dataHoraFinal);
        setPendingObms(response);
      } catch (error) {
        addNotification('Falha ao carregar cidades pendentes.', 'error');
        console.error('Erro ao buscar cidades pendentes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingObms();
  }, [dataHoraInicial, dataHoraFinal, addNotification]);

  const groupedObms = useMemo(() => {
    return pendingObms.reduce((acc: Record<string, IPendingObm[]>, obm) => {
      if (!acc[obm.crbm_nome]) {
        acc[obm.crbm_nome] = [];
      }
      acc[obm.crbm_nome].push(obm);
      return acc;
    }, {});
  }, [pendingObms]);

  const toggleCrbmGroup = (crbmNome: string) => {
    setOpenCrbmGroups(prev => ({ ...prev, [crbmNome]: !prev[crbmNome] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface border border-border p-6 text-text shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold text-text-strong">Cidades Pendentes ({new Date(dataHoraInicial).toLocaleDateString('pt-BR')} - {new Date(dataHoraFinal).toLocaleDateString('pt-BR')})</h2>

        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner text="Carregando cidades..." />
          </div>
        ) : pendingObms.length === 0 ? (
          <p className="text-center text-text">Todas as cidades enviaram dados para esta data!</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(groupedObms).map(([crbmNome, obmsList]) => (
              <div key={crbmNome} className="rounded-lg border border-border bg-background shadow-sm">
                <button
                  className="flex w-full items-center justify-between p-3 text-lg font-semibold text-text-strong"
                  onClick={() => toggleCrbmGroup(crbmNome)}
                >
                  CRBM: {crbmNome} ({obmsList.length})
                  {openCrbmGroups[crbmNome] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openCrbmGroups[crbmNome] && (
                  <div className="border-t border-border p-3 space-y-2">
                    {obmsList.map(obm => (
                      <div key={obm.id} className="flex justify-between items-center text-sm text-text">
                        <p>{obm.cidade_nome}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-gray-500 px-6 py-3 font-semibold text-white transition hover:bg-gray-600">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default CidadesPendentesModal;
