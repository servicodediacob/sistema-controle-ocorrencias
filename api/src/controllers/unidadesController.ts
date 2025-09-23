import { Request, Response } from 'express';
import db from '../db';

// Interface para o payload de criação/atualização
interface UnidadePayload {
  nome: string; // CORREÇÃO: O nome do campo no payload também foi ajustado para consistência.
  crbm_id: number;
}

/**
 * @description Lista todas as OBMs e seus respectivos CRBMs.
 */
export const getUnidades = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        obm.id, 
        obm.nome AS cidade_nome, -- Mantemos o alias 'cidade_nome' para não quebrar o frontend
        cr.nome AS crbm_nome,
        cr.id AS crbm_id
      FROM obms obm -- CORREÇÃO: Tabela 'cidades' alterada para 'obms'
      JOIN crbms cr ON obm.crbm_id = cr.id
      ORDER BY cr.nome, obm.nome;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[API] Erro ao buscar unidades (OBMs):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar unidades.' });
  }
};

/**
 * @description Cria uma nova OBM.
 */
export const criarUnidade = async (req: Request, res: Response): Promise<void> => {
  // CORREÇÃO: O payload agora espera 'nome' em vez de 'cidade_nome'
  const { nome, crbm_id } = req.body as UnidadePayload;

  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    // CORREÇÃO: Query ajustada para a tabela 'obms'
    const query = 'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[API] Erro ao criar unidade (OBM):', error);
    if ((error as any).code === '23505') {
      res.status(409).json({ message: `A OBM "${nome}" já existe.` });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar unidade.' });
  }
};

/**
 * @description Atualiza os dados de uma OBM.
 */
export const atualizarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, crbm_id } = req.body as UnidadePayload;

  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    // CORREÇÃO: Query ajustada para a tabela 'obms'
    const query = 'UPDATE obms SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id, id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`[API] Erro ao atualizar unidade (OBM ${id}):`, error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar unidade.' });
  }
};

/**
 * @description Exclui uma OBM.
 */
export const excluirUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // CORREÇÃO: Query ajustada para a tabela 'obms'
    const result = await db.query('DELETE FROM obms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    res.status(200).json({ message: 'Unidade excluída com sucesso.' });
  } catch (error) {
    console.error(`[API] Erro ao excluir unidade (OBM ${id}):`, error);
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a outros registros (ocorrências, usuários, etc.).' });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor ao excluir unidade.' });
  }
};

/**
 * @description Lista todos os CRBMs para popular dropdowns.
 */
export const getCrbms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM crbms ORDER BY nome ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('[API] Erro ao buscar CRBMs:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar CRBMs.' });
  }
};
