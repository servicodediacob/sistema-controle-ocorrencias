// Caminho: frontend/src/components/ObitosDoDiaWidget.tsx

import React, { useState, useEffect, useCallback } from 'react';
// Não precisamos mais de 'styled-components'
import { getObitosPorData, getNaturezasPorNomes, IObitoRegistro, IDataApoio } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

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
    setLoading(true);
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
  }, [addNotification, dataRelatorio]);

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 60000);
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

  return (
    <div className="mt-6 w-full rounded-lg bg-gray-800 p-6">
      <h3 className="mt-0 border-b border-gray-700 pb-4 text-lg font-semibold text-gray-200">
        Relatório de Óbitos do Dia
      </h3>
      {loading && registrosDoDia.length === 0 ? (
        <div className="py-8 text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[600px] w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-red-700 p-3 text-left text-sm font-bold uppercase text-white">NATUREZA</th>
                <th className="bg-red-700 p-3 text-left text-sm font-bold uppercase text-white">QTE</th>
                <th className="bg-red-700 p-3 text-left text-sm font-bold uppercase text-white">NÚMERO RAI E OBM RESPONSÁVEL</th>
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
                        <span className="text-cyan-400">
                          {`(${(r.numero_ocorrencia || 'N/A')}) - ${r.obm_responsavel || 'N/A'} (${r.quantidade_vitimas})`}
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
      )}
    </div>
  );
}

export default ObitosDoDiaWidget;
