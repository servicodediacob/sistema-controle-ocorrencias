import { ReactElement } from 'react';
import styled from 'styled-components';
import { IOcorrencia } from '../services/api';

// --- Styled Components ---
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
`;

const Th = styled.th`
  border-bottom: 1px solid #555;
  padding: 0.75rem;
  text-align: left;
  color: #aaa;
`;

const Td = styled.td`
  border-bottom: 1px solid #3a3a3a;
  padding: 0.75rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
`;

const EditButton = styled(Button)`
  background-color: #e9c46a;
  color: black;
`;

const DeleteButton = styled(Button)`
  background-color: #e76f51;
  color: white;
`;

const LoadingRow = styled.td`
  text-align: center;
  color: #888;
  padding: 2rem;
`;

// --- Component ---
interface OcorrenciaTableProps {
  ocorrencias: IOcorrencia[];
  loading: boolean;
  onEdit: (ocorrencia: IOcorrencia) => void;
  onDelete: (id: number) => void;
}

function OcorrenciaTable({ ocorrencias, loading, onEdit, onDelete }: OcorrenciaTableProps): ReactElement {
  if (loading) {
    return (
      <Table>
        <thead>
          <tr>
            <Th>ID</Th><Th>Data</Th><Th>Natureza</Th><Th>OBM</Th><Th>Óbitos</Th><Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <LoadingRow colSpan={6}>Carregando ocorrências...</LoadingRow>
          </tr>
        </tbody>
      </Table>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>ID</Th><Th>Data</Th><Th>Natureza</Th><Th>OBM</Th><Th>Óbitos</Th><Th>Ações</Th>
        </tr>
      </thead>
      <tbody>
        {ocorrencias.map(ocorrencia => (
          <tr key={ocorrencia.id}>
            <Td>{ocorrencia.id}</Td>
            <Td>{new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
            <Td>{ocorrencia.natureza_descricao}</Td>
            <Td>{ocorrencia.obm_nome}</Td>
            <Td>{ocorrencia.quantidade_obitos}</Td>
            <Td>
              <ActionButtons>
                <EditButton onClick={() => onEdit(ocorrencia)}>Editar</EditButton>
                <DeleteButton onClick={() => onDelete(ocorrencia.id)}>Excluir</DeleteButton>
              </ActionButtons>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default OcorrenciaTable;
