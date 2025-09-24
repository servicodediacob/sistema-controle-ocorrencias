// Caminho: frontend/src/pages/RelatorioObitosPage.tsx

import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import {
  getObitosPorData,
  criarObitoRegistro,
  atualizarObitoRegistro,
  limparRegistrosDoDia,
  getNaturezasPorNomes,
  getCidades,
  IObitoRegistro,
  IObitoRegistroPayload,
  IDataApoio,
  ICidade
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import RegistroObitoModal from '../components/RegistroObitoModal';
import ObitoNaturezaCard from '../components/ObitoNaturezaCard'; // 1. IMPORTAMOS O NOVO CARD
import Spinner from '../components/Spinner'; // Importamos o Spinner para um feedback melhor

// --- Constante (sem alterações) ---
const NATUREZAS_FIXAS_NOMES = [
  'ACIDENTE DE TRÂNSITO',
  'AFOGAMENTO OU CADÁVER',
  'ARMA DE FOGO/BRANCA/AGRESSÃO',
  'AUTO EXTÉRMÍNIO',
  'MAL SÚBITO',
  'ACIDENTES COM VIATURAS',
  'OUTROS'
];

// --- Componente Principal ---
function RelatorioObitosPage(): ReactElement {
  // --- Lógica e Estados (sem alterações) ---
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [naturezasDoRelatorio, setNaturezasDoRelatorio] = useState<IDataApoio[]>([]);
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [registrosDoDia, setRegistrosDoDia] = useState<IObitoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registroEmEdicao, setRegistroEmEdicao] = useState<IObitoRegistro | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getNaturezasPorNomes(NATUREZAS_FIXAS_NOMES),
      getCidades()
    ]).then(([naturezasData, cidadesData]) => {
      setNaturezasDoRelatorio(naturezasData);
      setCidades(cidadesData);
    }).catch(() => {
      addNotification('Falha ao carregar dados de apoio para o relatório.', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [addNotification]);

  const fetchDadosDoDia = useCallback(async (data: string) => {
    setLoading(true);
    try {
      const result = await getObitosPorData(data);
      setRegistrosDoDia(result);
    } catch (error) {
      addNotification('Falha ao carregar registros de óbitos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (naturezasDoRelatorio.length > 0) {
      fetchDadosDoDia(dataRelatorio);
    }
  }, [dataRelatorio, naturezasDoRelatorio, fetchDadosDoDia]);

  const handleSaveRegistro = async (formData: IObitoRegistroPayload, id?: number) => {
    try {
      if (id) {
        await atualizarObitoRegistro(id, formData);
        addNotification('Registro atualizado com sucesso!', 'success');
      } else {
        await criarObitoRegistro(formData);
        addNotification('Novo registro de óbito adicionado!', 'success');
      }
      setIsModalOpen(false);
      setRegistroEmEdicao(null);
      fetchDadosDoDia(dataRelatorio);
    } catch (error) {
      addNotification('Falha ao salvar o registro.', 'error');
    }
  };

  const handleEditClick = (registro: IObitoRegistro) => {
    setRegistroEmEdicao(registro);
    setIsModalOpen(true);
  };
  
  const handleLimparTabela = async () => {
    if (registrosDoDia.length === 0) {
        addNotification('Não há registros para limpar.', 'info');
        return;
    }
    const dataFormatada = new Date(dataRelatorio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    if (window.confirm(`Tem certeza que deseja excluir TODOS os ${registrosDoDia.length} registros do dia ${dataFormatada}? Esta ação não pode ser desfeita.`)) {
      try {
        setLoading(true);
        await limparRegistrosDoDia(dataRelatorio);
        addNotification('Todos os registros do dia foram excluídos.', 'success');
        fetchDadosDoDia(dataRelatorio);
      } catch (error) {
        addNotification('Falha ao limpar os registros.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRegistroEmEdicao(null);
    fetchDadosDoDia(dataRelatorio);
  };

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

  // --- JSX Refatorado com Tailwind CSS ---
  return (
    <MainLayout pageTitle="Lançamento de Óbitos para Relatório">
      {/* Controles (sem alteração) */}
      <div className="mb-8 flex flex-col items-stretch gap-4 rounded-lg bg-gray-800 p-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <label htmlFor="data-relatorio" className="text-sm text-gray-400">Data do Relatório</label>
          <input
            id="data-relatorio"
            type="date"
            value={dataRelatorio}
            onChange={e => setDataRelatorio(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-700 p-3 text-white"
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleLimparTabela}
            disabled={loading || registrosDoDia.length === 0}
            className="rounded-md bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpar Tabela
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar Registro
          </button>
        </div>
      </div>

      {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
      {loading ? (
        <div className="flex justify-center p-10"><Spinner text="Carregando registros..." /></div>
      ) : (
        <>
          {/* 2. VISUALIZAÇÃO MOBILE (usando o novo Card) */}
          <div className="space-y-4 md:hidden">
            {dadosTabela.map((item) => (
              <ObitoNaturezaCard key={item.nome} item={item} onEditClick={handleEditClick} />
            ))}
            {/* Mensagem se não houver nenhum registro */}
            {totalGeral === 0 && (
              <div className="py-10 text-center text-gray-500">Nenhum óbito registrado para esta data.</div>
            )}
            {/* Totalizador Mobile */}
            <div className="rounded-lg bg-red-800 p-4 text-center font-bold text-white">
              TOTAL GERAL: {totalGeral}
            </div>
          </div>

          {/* 3. VISUALIZAÇÃO DESKTOP (a tabela original, agora oculta em telas pequenas) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[600px] w-full border-collapse overflow-hidden rounded-lg bg-gray-800">
              <thead>
                <tr>
                  <th className="bg-red-700 p-4 text-left text-sm font-bold uppercase text-white">Natureza</th>
                  <th className="bg-red-700 p-4 text-left text-sm font-bold uppercase text-white">QTE</th>
                  <th className="bg-red-700 p-4 text-left text-sm font-bold uppercase text-white">Número RAI e OBM Responsável</th>
                </tr>
              </thead>
              <tbody>
                {dadosTabela.map((item) => (
                  <tr key={item.nome} className="border-b border-gray-700">
                    <td className="p-4">{item.nome}</td>
                    <td className="p-4">{item.quantidade}</td>
                    <td className="p-4">
                      {item.registros.map((r, index) => (
                        <React.Fragment key={r.id}>
                          <span
                            onClick={() => handleEditClick(r)}
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
                  <td className="p-4">TOTAL</td>
                  <td className="p-4">{totalGeral}</td>
                  <td className="p-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* ======================= FIM DA CORREÇÃO ======================= */}

      {isModalOpen && (
        <RegistroObitoModal
          dataOcorrencia={dataRelatorio}
          naturezas={naturezasDoRelatorio}
          cidades={cidades}
          onClose={handleCloseModal}
          onSave={handleSaveRegistro}
          registroParaEditar={registroEmEdicao}
        />
      )}
    </MainLayout>
  );
}

export default RelatorioObitosPage;
