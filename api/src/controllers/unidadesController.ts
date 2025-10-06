import { Request, Response } from 'express';
import db from '@/db';
import logger from '@/config/logger';

export const getUnidades = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        obm.id, 
        obm.nome AS cidade_nome, 
        cr.nome AS crbm_nome,
        cr.id AS crbm_id
      FROM obms obm
      JOIN crbms cr ON obm.crbm_id = cr.id
      ORDER BY cr.nome, obm.nome;
    `;
    const { rows } = await db.query(query);
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Garante que a resposta seja sempre um JSON com um array,
    // mesmo que a consulta não retorne nenhuma linha.
    res.status(200).json(rows || []);
    // --- FIM DA CORREÇÃO ---

  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar unidades (OBMs).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const criarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { nome, crbm_id } = req.body;
  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }
  try {
    const query = 'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id]);
    logger.info({ unidade: rows[0] }, 'Nova unidade (OBM) criada.');
    res.status(201).json(rows[0]);
  } catch (error) {
    if ((error as any).code === '23505') {
      res.status(409).json({ message: `A OBM "${nome}" já existe.` });
      return;
    }
    logger.error({ err: error, body: req.body }, 'Erro ao criar unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, crbm_id } = req.body;
  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
    return;
  }
  try {
    const query = 'UPDATE obms SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id, id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    logger.info({ unidade: rows[0] }, 'Unidade (OBM) atualizada.');
    res.status(200).json(rows[0]);
  } catch (error) {
    logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const excluirUnidade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM obms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    logger.info({ unidadeId: id }, 'Unidade (OBM) excluída.');
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a outros registros.' });
      return;
    }
    logger.error({ err: error, unidadeId: id }, 'Erro ao excluir unidade (OBM).');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const getCrbms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM crbms ORDER BY nome ASC');
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar CRBMs.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
