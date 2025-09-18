import { Request, Response } from 'express';
import db from '../db';

// Interface para o payload de criação/atualização
interface UnidadePayload {
  cidade_nome: string;
  crbm_id: number;
}

/**
 * @description Lista todas as cidades e seus respectivos CRBMs.
 */
export const getUnidades = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.nome AS cidade_nome,
        cr.nome AS crbm_nome,
        cr.id AS crbm_id
      FROM cidades c
      JOIN crbms cr ON c.crbm_id = cr.id
      ORDER BY cr.nome, c.nome;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[API] Erro ao buscar unidades (cidades):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar unidades.' });
  }
};

/**
 * @description Cria uma nova Cidade.
 */
export const criarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { cidade_nome, crbm_id } = req.body as UnidadePayload;

  if (!cidade_nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da cidade e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    const query = 'INSERT INTO cidades (nome, crbm_id) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [cidade_nome, crbm_id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[API] Erro ao criar unidade (cidade):', error);
    if ((error as any).code === '23505') {
      res.status(409).json({ message: `A cidade "${cidade_nome}" já existe.` });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar unidade.' });
  }
};

/**
 * @description Atualiza os dados de uma cidade.
 */
export const atualizarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { cidade_nome, crbm_id } = req.body as UnidadePayload;

  if (!cidade_nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da cidade e ID do CRBM são obrigatórios.' });
    return;
  }

  try {
    const query = 'UPDATE cidades SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
    const { rows } = await db.query(query, [cidade_nome, crbm_id, id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Cidade não encontrada.' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`[API] Erro ao atualizar unidade (cidade ${id}):`, error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar unidade.' });
  }
};

/**
 * @description Exclui uma cidade.
 */
export const excluirUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM cidades WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Cidade não encontrada.' });
      return;
    }
    res.status(200).json({ message: 'Unidade excluída com sucesso.' });
  } catch (error) {
    console.error(`[API] Erro ao excluir unidade (cidade ${id}):`, error);
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir esta cidade, pois ela está associada a ocorrências existentes.' });
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
