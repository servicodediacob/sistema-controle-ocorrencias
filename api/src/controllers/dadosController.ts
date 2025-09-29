import { Request, Response } from 'express';
import db from '@/db';
import logger from '@/config/logger';

export const getNaturezas = async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, grupo, subgrupo, abreviacao FROM naturezas_ocorrencia ORDER BY grupo, subgrupo ASC');
    return res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar naturezas.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const getNaturezasPorNomes = async (req: Request, res: Response) => {
  const { nomes } = req.body;

  if (!Array.isArray(nomes) || nomes.length === 0) {
    return res.status(400).json({ message: 'Um array de nomes de subgrupo é obrigatório.' });
  }

  try {
    const inPlaceholders = nomes.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      SELECT id, subgrupo 
      FROM naturezas_ocorrencia 
      WHERE subgrupo IN (${inPlaceholders})
      ORDER BY subgrupo;
    `;
    
    const { rows } = await db.query(query, nomes);
    
    return res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error, nomes }, 'Erro ao buscar naturezas por nomes.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const criarNatureza = async (req: Request, res: Response) => {
  const { grupo, subgrupo, abreviacao } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
  }
  try {
    const query = 'INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await db.query(query, [grupo, subgrupo, abreviacao || null]);
    logger.info({ natureza: rows[0] }, 'Nova natureza de ocorrência criada.');
    return res.status(201).json(rows[0]);
  } catch (error) {
    if ((error as any).code === '23505') {
        return res.status(409).json({ message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.` });
    }
    logger.error({ err: error, body: req.body }, 'Erro ao criar natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { grupo, subgrupo, abreviacao } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
  }
  try {
    const query = 'UPDATE naturezas_ocorrencia SET grupo = $1, subgrupo = $2, abreviacao = $3 WHERE id = $4 RETURNING *';
    const { rows } = await db.query(query, [grupo, subgrupo, abreviacao || null, id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Natureza não encontrada.' });
    }
    logger.info({ natureza: rows[0] }, 'Natureza de ocorrência atualizada.');
    return res.status(200).json(rows[0]);
  } catch (error) {
    if ((error as any).code === '23505') {
        return res.status(409).json({ message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.` });
    }
    logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const excluirNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM naturezas_ocorrencia WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Natureza não encontrada.' });
    }
    logger.info({ naturezaId: id }, 'Natureza de ocorrência excluída.');
    return res.status(204).send();
  } catch (error) {
    if ((error as any).code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir esta natureza, pois ela está associada a registros existentes.' });
    }
    logger.error({ err: error, naturezaId: id }, 'Erro ao excluir natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
