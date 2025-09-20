// Caminho: frontend/src/pages/LancamentoPage.tsx

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  getCidades, 
  getNaturezas, 
  ICidade, 
  IDataApoio, 
  registrarEstatisticasLote,
  getEstatisticasAgrupadasPorData,
  IEstatisticaAgrupada,
  limparEstatisticasDoDia // <-- Importa a nova função
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import MainLayout from '../components/MainLayout';
import LancamentoModal from '../components/LancamentoModal';
import LancamentoTabela from '../components/LancamentoTabela';

// --- Styled Components ---
const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #aaa;
`;

const InputDate = styled.input`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
`;

const ActionsGroup = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-end;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddButton = styled(ActionButton)`
  background-color: #2a9d8f;
  color: white;
`;

const ClearButton = styled(ActionButton)`
  background-color: #e76f51;
  color: white;
`;

const ORDEM_COLUNAS: Array<{ subgrupo: string; abreviacao: string }> = [
    { subgrupo: 'Resgate', abreviacao: 'RESGATE' },
    { subgrupo: 'Incêndio em Vegetação', abreviacao: 'INC. VEG' },
    { subgrupo: 'Incêndio em Edificação', abreviacao: 'INC. EDIF' },
    { subgrupo: 'Incêndio - Outros', abreviacao: 'INC. OUT.' },
    { subgrupo: 'Busca de Cadáver', abreviacao: 'B. CADÁVER' },
    { subgrupo: 'Busca e Salvamento - Diversos', abreviacao: 'B. SALV.' },
    { subgrupo: 'Palestras', abreviacao: 'AP. PAL' },
    { subgrupo: 'Eventos', abreviacao: 'AP. EVE' },
    { subgrupo: 'Folders / Panfletos', abreviacao: 'AP. FOL' },
    { subgrupo: 'Outros', abreviacao: 'AP. OUT' },
    { subgrupo: 'Inspeções', abreviacao: 'AT. INS' },
    { subgrupo: 'Análise de Projetos', abreviacao: 'AN. PROJ' },
    { subgrupo: 'Vazamentos', abreviacao: 'PPV' },
    { subgrupo: 'Outros / Diversos', abreviacao: 'PPO' },
    { subgrupo: 'Preventiva', abreviacao: 'DC PREV.' },
    { subgrupo: 'De Resposta', abreviacao: 'DC RESP.' },
];

function LancamentoPage() {
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [dadosTabela, setDadosTabela] = useState<IEstatisticaAgrupada[]>([]);
  const colunasNatureza = ORDEM_COLUNAS;

  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<{ cidade: ICidade; dados: Record<string, number> } | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchApoio = async () => {
      try {
        const [cidadesData, naturezasData] = await Promise.all([getCidades(), getNaturezas()]);
        setCidades(cidadesData);
        setNaturezas(naturezasData);
      } catch (error) {
        addNotification('Erro ao carregar dados de apoio.', 'error');
      }
    };
    fetchApoio();
  }, [addNotification]);

  const fetchDadosTabela = useCallback(async () => {
    if (!dataRegistro) return;
    setLoading(true);
    try {
      const dados = await getEstatisticasAgrupadasPorData(dataRegistro);
      setDadosTabela(dados);
    } catch (error) {
      addNotification('Falha ao carregar lançamentos do dia.', 'error');
    } finally {
      setLoading(false);
    }
  }, [dataRegistro, addNotification]);

  useEffect(() => {
    fetchDadosTabela();
  }, [fetchDadosTabela]);

  const handleSave = async (formData: any) => {
    const payload = {
      data_registro: formData.data_ocorrencia,
      cidade_id: formData.cidade_id,
      estatisticas: Object.entries(formData.quantidades)
        .map(([natureza_id, quantidadeStr]) => ({
          natureza_id: parseInt(natureza_id, 10),
          quantidade: parseInt(quantidadeStr as string, 10) || 0,
        }))
        .filter(({ quantidade }) => quantidade > 0),
    };

    if (payload.estatisticas.length === 0 && !itemParaEditar) {
      addNotification('Nenhum valor foi preenchido.', 'info');
      return;
    }

    try {
      // Para edição, primeiro limpamos os dados antigos da cidade
      if (itemParaEditar) {
        await limparEstatisticasDoDia(payload.data_registro);
      }
      
      const response = await registrarEstatisticasLote(payload);
      addNotification(itemParaEditar ? 'Lançamentos atualizados com sucesso!' : response.message, 'success');
      
      setIsModalOpen(false);
      setItemParaEditar(null);
      fetchDadosTabela();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar os dados.';
      addNotification(message, 'error');
    }
  };

  const handleEdit = (cidade: ICidade, dadosAtuais: Record<string, number>) => {
    setItemParaEditar({ cidade, dados: dadosAtuais });
    setIsModalOpen(true);
  };

  const handleLimparTabela = async () => {
    const dataFormatada = new Date(dataRegistro).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    if (window.confirm(`Tem certeza que deseja excluir TODOS os lançamentos do dia ${dataFormatada}? Esta ação não pode ser desfeita.`)) {
      try {
        setLoading(true);
        await limparEstatisticasDoDia(dataRegistro);
        addNotification('Todos os registros do dia foram excluídos.', 'success');
        fetchDadosTabela();
      } catch (error) {
        addNotification('Falha ao limpar os registros.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <MainLayout pageTitle="Formulário de Lançamento de Ocorrências">
      <ControlsContainer>
        <ControlGroup>
          <Label htmlFor="data-registro">Data de Visualização</Label>
          <InputDate 
            id="data-registro" 
            type="date" 
            value={dataRegistro} 
            onChange={e => setDataRegistro(e.target.value)} 
          />
        </ControlGroup>
        <ActionsGroup>
            <ClearButton onClick={handleLimparTabela} disabled={loading || dadosTabela.length === 0}>
                Limpar Plantão
            </ClearButton>
            <AddButton onClick={() => { setItemParaEditar(null); setIsModalOpen(true); }} disabled={cidades.length === 0}>
                Adicionar Lançamento
            </AddButton>
        </ActionsGroup>
      </ControlsContainer>

      <LancamentoTabela
        dadosApi={dadosTabela}
        cidades={cidades}
        naturezas={colunasNatureza}
        loading={loading || cidades.length === 0}
        onEdit={handleEdit}
      />

      {isModalOpen && (
        <LancamentoModal
          onClose={() => { setIsModalOpen(false); setItemParaEditar(null); }}
          onSave={handleSave}
          cidades={cidades}
          naturezas={naturezas.filter(n => n.grupo !== 'Relatório de Óbitos')}
          itemParaEditar={itemParaEditar}
        />
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
