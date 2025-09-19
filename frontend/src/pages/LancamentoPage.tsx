// src/pages/LancamentoPage.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getCidades, getNaturezas, ICidade, IDataApoio, registrarEstatisticasLote } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// 1. Importar o layout principal
import MainLayout from '../components/MainLayout';

// --- Styled Components (sem alterações na estilização interna) ---
// REMOVIDO: Container, Header, BackLink, pois o MainLayout cuida disso.

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TopControls = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  background-color: #2c2c2c;
  padding: 1rem;
  border-radius: 8px;
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

const Select = styled.select`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  min-width: 250px;
`;

const InputDate = styled.input`
  padding: 0.65rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
`;

const Fieldset = styled.fieldset`
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
`;

const Legend = styled.legend`
  padding: 0 0.5rem;
  font-weight: bold;
  font-size: 1.2rem;
  color: #e9c46a;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const NumberInput = styled.input`
  padding: 0.75rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #3a7ca5;
  color: white;
  font-size: 1rem;
  cursor: pointer;
`;

const ClearButton = styled(SubmitButton)`
  background-color: #e76f51;
`;


function LancamentoPage() {
  const [cidades, setCidades] = useState<ICidade[]>([]);
  const [naturezas, setNaturezas] = useState<IDataApoio[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCidade, setSelectedCidade] = useState<string>('');
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [valores, setValores] = useState<{ [key: number]: string }>({});
  
  const { addNotification } = useNotification();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [cidadesData, naturezasData] = await Promise.all([getCidades(), getNaturezas()]);
        setCidades(cidadesData);
        setNaturezas(naturezasData);
      } catch (error) {
        addNotification('Erro ao carregar dados para o formulário.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addNotification]);

  const handleValueChange = (naturezaId: number, valor: string) => {
    setValores(prev => ({ ...prev, [naturezaId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCidade) {
      addNotification('Por favor, selecione uma OBM (Cidade).', 'error');
      return;
    }

    const payload = {
      data_registro: dataRegistro,
      cidade_id: parseInt(selectedCidade, 10),
      estatisticas: Object.entries(valores)
        .map(([natureza_id, quantidadeStr]) => ({
          natureza_id: parseInt(natureza_id, 10),
          quantidade: parseInt(quantidadeStr, 10) || 0,
        }))
        .filter(({ quantidade }) => quantidade > 0),
    };

    if (payload.estatisticas.length === 0) {
      addNotification('Nenhum valor foi preenchido.', 'info');
      return;
    }

    try {
      await registrarEstatisticasLote(payload);
      addNotification('Dados enviados com sucesso!', 'success');
      setValores({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar os dados.';
      addNotification(message, 'error');
    }
  };

  const naturezasAgrupadas = naturezas.reduce((acc, nat) => {
    const grupo = nat.grupo || 'Outros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(nat);
    return acc;
  }, {} as { [key: string]: IDataApoio[] });

  return (
    // 2. Envolver o conteúdo com MainLayout
    <MainLayout pageTitle="Formulário de Lançamento de Ocorrências">
      {loading ? (
        <p>Carregando formulário...</p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <TopControls>
            <ControlGroup>
              <Label htmlFor="cidade-select">OBM (Obrigatório)</Label>
              <Select id="cidade-select" value={selectedCidade} onChange={e => setSelectedCidade(e.target.value)} required>
                <option value="">Selecione uma OBM</option>
                {cidades.map(c => <option key={c.id} value={c.id}>{c.cidade_nome}</option>)}
              </Select>
            </ControlGroup>
            <ControlGroup>
              <Label htmlFor="data-registro">Data de Registro</Label>
              <InputDate id="data-registro" type="date" value={dataRegistro} onChange={e => setDataRegistro(e.target.value)} required />
            </ControlGroup>
          </TopControls>

          {Object.entries(naturezasAgrupadas).map(([grupo, nats]) => (
            <Fieldset key={grupo}>
              <Legend>{grupo}</Legend>
              <FormGrid>
                {nats.map(nat => (
                  <InputGroup key={nat.id}>
                    <InputLabel htmlFor={`natureza-${nat.id}`}>{nat.subgrupo}</InputLabel>
                    <NumberInput
                      id={`natureza-${nat.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={valores[nat.id] || ''}
                      onChange={e => handleValueChange(nat.id, e.target.value)}
                    />
                  </InputGroup>
                ))}
              </FormGrid>
            </Fieldset>
          ))}
          
          <ButtonContainer>
            <SubmitButton type="submit">Enviar Dados</SubmitButton>
            <ClearButton type="button" onClick={() => setValores({})}>Limpar Formulário</ClearButton>
          </ButtonContainer>
        </Form>
      )}
    </MainLayout>
  );
}

export default LancamentoPage;
