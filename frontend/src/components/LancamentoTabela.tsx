// Caminho: frontend/src/components/LancamentoTabela.tsx

import React from 'react';
import styled from 'styled-components';
import { IEstatisticaAgrupada, ICidade } from '../services/api';

// --- Styled Components ---
const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #444;
  border-radius: 8px;
  margin-top: 2rem;
  background-color: #2c2c2c;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1300px; /* Aumenta um pouco a largura para a nova coluna */
  
  th, td {
    border: 1px solid #444;
    padding: 0.75rem;
    text-align: center;
    white-space: nowrap;
  }

  th {
    background-color: #3a3a3a;
    position: sticky;
    top: 0;
    z-index: 3;
    text-transform: uppercase;
  }

  .crbm-cell, .cidade-cell {
    text-align: left;
    font-weight: bold;
    background-color: #2c2c2c;
    position: sticky;
  }

  .crbm-cell { left: 0; width: 150px; z-index: 2; }
  .cidade-cell { left: 150px; width: 250px; z-index: 1; }
  
  .cidade-pendente {
    background-color: #583131;
    color: #ffcdd2;
  }

  .total-column {
    background-color: #2a4a65;
    font-weight: bold;
  }

  .total-row td {
    background-color: #3a7ca5;
    font-weight: bold;
    color: white;
  }

  .grand-total-row td {
    background-color: #e9c46a;
    color: #1e1e1e;
  }
`;

const EditButton = styled.button`
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border: none;
  border-radius: 4px;
  background-color: #e9c46a;
  color: black;
  cursor: pointer;
  &:hover { background-color: #f0d48a; }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #888;
  background-color: #2c2c2c;
  border-radius: 8px;
  margin-top: 2rem;
`;

// --- Interfaces ---
interface LancamentoTabelaProps {
  dadosApi: IEstatisticaAgrupada[];
  cidades: ICidade[];
  naturezas: Array<{ subgrupo: string; abreviacao: string }>;
  loading: boolean;
  onEdit: (cidade: ICidade, dadosAtuais: Record<string, number>) => void; // <-- NOVA PROP
}

const LancamentoTabela: React.FC<LancamentoTabelaProps> = ({ dadosApi, cidades, naturezas, loading, onEdit }) => {
  if (loading) {
    return <EmptyState>Carregando dados...</EmptyState>;
  }

  const dadosMapa = dadosApi.reduce((acc, item) => {
    if (!acc[item.cidade_nome]) {
      acc[item.cidade_nome] = {};
    }
    acc[item.cidade_nome][item.natureza_nome] = item.quantidade;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const cidadesAgrupadas = cidades.reduce((acc, cidade) => {
    const crbm = cidade.crbm_nome;
    if (!acc[crbm]) {
      acc[crbm] = [];
    }
    acc[crbm].push(cidade);
    return acc;
  }, {} as Record<string, ICidade[]>);

  const totais = {
    crbm: {} as Record<string, Record<string, number>>,
    geral: {} as Record<string, number>
  };

  naturezas.forEach(nat => totais.geral[nat.subgrupo] = 0);
  totais.geral['TOTAL'] = 0;

  for (const crbm in cidadesAgrupadas) {
    totais.crbm[crbm] = {};
    naturezas.forEach(nat => totais.crbm[crbm][nat.subgrupo] = 0);
    totais.crbm[crbm]['TOTAL'] = 0;

    for (const cidade of cidadesAgrupadas[crbm]) {
      const dadosCidade = dadosMapa[cidade.cidade_nome] || {};
      let totalCidade = 0;
      for (const natureza of naturezas) {
        const qtd = dadosCidade[natureza.subgrupo] || 0;
        totais.crbm[crbm][natureza.subgrupo] += qtd;
        totais.geral[natureza.subgrupo] += qtd;
        totalCidade += qtd;
      }
      totais.crbm[crbm]['TOTAL'] += totalCidade;
      totais.geral['TOTAL'] += totalCidade;
    }
  }

  return (
    <TableWrapper>
      <StyledTable>
        <thead>
          <tr>
            <th className="crbm-cell">CRBM</th>
            <th className="cidade-cell">QUARTEL / CIDADE</th>
            {naturezas.map(nat => <th key={nat.subgrupo}>{nat.abreviacao}</th>)}
            <th className="total-column">TOTAL</th>
            <th>AÇÕES</th> {/* <-- NOVA COLUNA */}
          </tr>
        </thead>
        <tbody>
          {Object.entries(cidadesAgrupadas).map(([crbm, listaCidades]) => (
            <React.Fragment key={crbm}>
              {listaCidades.map((cidade, index) => {
                const ocorrências = dadosMapa[cidade.cidade_nome] || {};
                const totalLinha = Object.values(ocorrências).reduce((a, b) => a + b, 0);
                const isPendente = totalLinha === 0;
                const classeCidade = `cidade-cell ${isPendente ? 'cidade-pendente' : ''}`;

                return (
                  <tr key={cidade.id}>
                    {index === 0 && <td className="crbm-cell" rowSpan={listaCidades.length + 1}>{crbm}</td>}
                    <td className={classeCidade}>{cidade.cidade_nome}</td>
                    {naturezas.map(nat => <td key={nat.subgrupo}>{ocorrências[nat.subgrupo] || 0}</td>)}
                    <td className="total-column"><strong>{totalLinha}</strong></td>
                    <td>
                      <EditButton onClick={() => onEdit(cidade, ocorrências)}>
                        Editar
                      </EditButton>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                {naturezas.map(nat => <td key={nat.subgrupo}><strong>{totais.crbm[crbm][nat.subgrupo] || 0}</strong></td>)}
                <td className="total-column"><strong>{totais.crbm[crbm]['TOTAL']}</strong></td>
                <td></td> {/* Célula vazia na coluna de ações */}
              </tr>
            </React.Fragment>
          ))}
          <tr className="grand-total-row">
             <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL GERAL</td>
             {naturezas.map(nat => <td key={nat.subgrupo}><strong>{totais.geral[nat.subgrupo] || 0}</strong></td>)}
             <td className="total-column"><strong>{totais.geral['TOTAL']}</strong></td>
             <td></td> {/* Célula vazia na coluna de ações */}
          </tr>
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default LancamentoTabela;
