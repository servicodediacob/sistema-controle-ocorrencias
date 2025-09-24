// Caminho: frontend/src/components/ObitosDoDiaWidget.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getObitosPorData, getNaturezasPorNomes, IObitoRegistro, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import ObitoNaturezaCard from './ObitoNaturezaCard'; // IMPORTAMOS O CARD
import Spinner from './Spinner';

const NATUREZAS_FIXAS_NOMES = [
  'ACIDENTE DE TRÂNSITO', 'AFOGAMENTO OU CADÁVER', 'ARMA DE FOGO/BRANCA/AGRESSÃO',
  'AUTO EXTÉRMÍNIO', 'MAL SÚBITO', 'ACIDENTES COM VIATURAS', 'OUTROS'
];

function ObitosDoDiaWidget() {
  const [dataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezasDoRelatorio, setNaturezasDoRelatorio] = useState<IDataApoio[]>([]);
  const [registrosDoDia, setRegistrosDoDia] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchDados = useCallback(async () => {
    // Não mostra o spinner em atualizações automáticas, apenas na primeira carga
    if (registrosDoDia.length === 0) {
      setLoading(true);
    }
    try {
      const [naturezasData, obitosData] = await Promise.all([
        getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES),
        getObitosPorData(dataRelatorio)
      ]);
      setNaturezasDoRelatorio(naturezasData);
      setRegistrosDoDia(obitosData);
    } catch (error) {
      addNotification('Falha ao carregar dados de óbitos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, dataRelatorio, registrosDoDia.length]);

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval);
  }, [fetchDados]);

  const dadosTabela = naturezasDoRelatorio.map(natureza => {
    const registrosDaNatureza = registrosDoDia.filter(r => r.natureza_id === natureza.id);
    const quantidade = registrosDaNatureza.reduce((acc, curr) => acc + curr.quantidade_vitimas, 0);
    return {
      nome: natureza.subgrupo,
      quantidade,
      registros: registrosDaNatureza
    };
  });

  const totalGeral = dadosTabela.reduce((acc, curr) => acc + curr.quantidade, 0);

  // Placeholder para a função de edição, já que não editamos a partir do widget
  const handleEditPlaceholder = () => {
    addNotification('Para editar, acesse a página "Relatório de Óbitos".', 'info');
  };

  return (
    <div className="mt-6 w-full rounded-lg bg-gray-800 p-6">
      <h3 className="mt-0 border-b border-gray-700 pb-4 text-lg font-semibold text-gray-200">
        Relatório de Óbitos do Dia
      </h3>
      
      {loading ? (
        <div className="flex justify-center p-10"><Spinner text="Carregando óbitos do dia..." /></div>
      ) : (
        <div className="mt-4">
          {/* ======================= INÍCIO DA CORREÇÃO ======================= */}

          {/* VISUALIZAÇÃO MOBILE (Cards) */}
          <div className="space-y-4 md:hidden">
            {dadosTabela.map((item) => (
              <ObitoNaturezaCard key={item.nome} item={item} onEditClick={handleEditPlaceholder} />
            ))}
            {totalGeral === 0 && (
              <div className="py-10 text-center text-gray-500">Nenhum óbito registrado para esta data.</div>
            )}
            <div className="rounded-lg bg-red-800 p-4 text-center font-bold text-white">
              TOTAL GERAL: {totalGeral}
            </div>
          </div>

          {/* VISUALIZAÇÃO DESKTOP (Tabela) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[600px] w-full border-collapse">
              <thead className="bg-red-700 text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-bold uppercase">NATUREZA</th>
                  <th className="p-3 text-left text-sm font-bold uppercase">QTE</th>
                  <th className="p-3 text-left text-sm font-bold uppercase">NÚMERO RAI E OBM RESPONSÁVEL</th>
                </tr>
              </thead>
              <tbody>
                {dadosTabela.map((item) => (
                  <tr key={item.nome} className="border-b border-gray-700">
                    <td className="p-3">{item.nome}</td>
                    <td className="p-3">{item.quantidade}</td>
                    <td className="p-3">
                      {item.registros.map((r, index) => (
                        <React.Fragment key={r.id}>
                          <span
                            onClick={handleEditPlaceholder}
                            className="cursor-pointer text-cyan-400 underline decoration-dotted hover:text-cyan-300"
                          >
                            {`(${r.numero_ocorrencia || 'N/A'}) - ${r.obm_nome || 'N/A'} (${r.quantidade_vitimas})`}
                          </span>
                          {index < item.registros.length - 1 && '; '}
                        </React.Fragment>
                      ))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-800 font-bold text-white">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3">{totalGeral}</td>
                  <td className="p-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* ======================= FIM DA CORREÇÃO ======================= */}
        </div>
      )}
    </div>
  );
}

export default ObitosDoDiaWidget;
