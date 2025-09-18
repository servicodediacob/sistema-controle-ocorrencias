import { Request, Response } from 'express';
import db from '../db';

// ===============================================
// OBMs (Organizações Bombeiro Militar)
// ===============================================

export const getObms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM obms ORDER BY nome ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar OBMs:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar OBMs.' });
  }
};

export const criarObm = async (req: Request, res: Response): Promise<void> => {
  const { nome, crbm_id } = req.body;
  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome e ID do CRBM são obrigatórios.' });
    return;
  }
  try {
    const query = 'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar OBM:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar OBM.' });
  }
};

export const atualizarObm = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, crbm_id } = req.body;
  if (!nome || !crbm_id) {
    res.status(400).json({ message: 'Nome e ID do CRBM são obrigatórios.' });
    return;
  }
  try {
    const query = 'UPDATE obms SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
    const { rows } = await db.query(query, [nome, crbm_id, id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar OBM:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar OBM.' });
  }
};

export const excluirObm = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM obms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'OBM não encontrada.' });
      return;
    }
    res.status(200).json({ message: 'OBM excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir OBM:', error);
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a ocorrências existentes.' });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor ao excluir OBM.' });
  }
};

// ===============================================
// NATUREZAS DE OCORRÊNCIA
// ===============================================

export const getNaturezas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM naturezas_ocorrencia ORDER BY descricao ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar naturezas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar naturezas.' });
  }
};

export const criarNatureza = async (req: Request, res: Response): Promise<void> => {
  const { descricao } = req.body;
  if (!descricao) {
    res.status(400).json({ message: 'A descrição é obrigatória.' });
    return;
  }
  try {
    const query = 'INSERT INTO naturezas_ocorrencia (descricao) VALUES ($1) RETURNING *';
    const { rows } = await db.query(query, [descricao]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar natureza:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar natureza.' });
  }
};

export const atualizarNatureza = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { descricao } = req.body;
  if (!descricao) {
    res.status(400).json({ message: 'A descrição é obrigatória.' });
    return;
  }
  try {
    const query = 'UPDATE naturezas_ocorrencia SET descricao = $1 WHERE id = $2 RETURNING *';
    const { rows } = await db.query(query, [descricao, id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Natureza não encontrada.' });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar natureza:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar natureza.' });
  }
};

export const excluirNatureza = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM naturezas_ocorrencia WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Natureza não encontrada.' });
      return;
    }
    res.status(200).json({ message: 'Natureza excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir natureza:', error);
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir esta natureza, pois ela está associada a ocorrências existentes.' });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor ao excluir natureza.' });
  }
};

// ===============================================
// OCORRÊNCIAS
// ===============================================

export const criarOcorrencia = async (req: Request, res: Response): Promise<void> => {
  const { ocorrencia, obitos } = req.body;

  if (!ocorrencia || !ocorrencia.obm_id || !ocorrencia.natureza_id || !ocorrencia.data_ocorrencia) {
    res.status(400).json({ message: 'Dados da ocorrência incompletos. OBM, Natureza e Data são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const queryOcorrencia = `
      INSERT INTO ocorrencias (data_ocorrencia, natureza_id, obm_id, quantidade_obitos)
      VALUES ($1, $2, $3, $4)
      RETURNING id; 
    `;
    const ocorrenciaValues = [
      ocorrencia.data_ocorrencia,
      ocorrencia.natureza_id,
      ocorrencia.obm_id,
      obitos ? obitos.length : 0
    ];
    const resultOcorrencia = await client.query(queryOcorrencia, ocorrenciaValues);
    const novaOcorrenciaId = resultOcorrencia.rows[0].id;

    if (obitos && obitos.length > 0) {
      for (const obito of obitos) {
        const queryObito = `
          INSERT INTO obitos (ocorrencia_id, nome_vitima, idade_vitima, genero)
          VALUES ($1, $2, $3, $4);
        `;
        const obitoValues = [
          novaOcorrenciaId,
          obito.nome_vitima,
          obito.idade_vitima,
          obito.genero
        ];
        await client.query(queryObito, obitoValues);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Ocorrência e óbitos registrados com sucesso!',
      ocorrenciaId: novaOcorrenciaId 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar ocorrência (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar a ocorrência.' });

  } finally {
    client.release();
  }
};

export const getOcorrencias = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const ocorrenciasQuery = `
      SELECT 
        o.id, o.data_ocorrencia, o.quantidade_obitos, o.natureza_id, o.obm_id,
        n.descricao AS natureza_descricao, obm.nome AS obm_nome, cr.nome AS crbm_nome
      FROM ocorrencias o
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      JOIN obms obm ON o.obm_id = obm.id
      JOIN crbms cr ON obm.crbm_id = cr.id
      ORDER BY o.data_ocorrencia DESC, o.id DESC
      LIMIT $1 OFFSET $2;
    `;
    
    const { rows: ocorrencias } = await db.query(ocorrenciasQuery, [limit, offset]);

    const totalQuery = 'SELECT COUNT(*) FROM ocorrencias;';
    const { rows: totalRows } = await db.query(totalQuery);
    const total = parseInt(totalRows[0].count, 10);

    res.status(200).json({
      ocorrencias,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('Erro ao buscar ocorrências:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar ocorrências.' });
  }
};

export const updateOcorrencia = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data_ocorrencia, natureza_id, obm_id } = req.body;

  if (!data_ocorrencia || !natureza_id || !obm_id) {
    res.status(400).json({ message: 'Todos os campos são obrigatórios para atualização.' });
    return;
  }

  try {
    const query = `
      UPDATE ocorrencias SET data_ocorrencia = $1, natureza_id = $2, obm_id = $3
      WHERE id = $4 RETURNING *;
    `;
    const { rows } = await db.query(query, [data_ocorrencia, natureza_id, obm_id, id]);

    if (rows.length === 0) {
      res.status(404).json({ message: 'Ocorrência não encontrada.' });
      return;
    }

    res.status(200).json({ message: 'Ocorrência atualizada com sucesso!', ocorrencia: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar ocorrência:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar a ocorrência.' });
  }
};

export const deleteOcorrencia = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM ocorrencias WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Ocorrência não encontrada.' });
      return;
    }

    res.status(200).json({ message: 'Ocorrência excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir ocorrência:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao excluir a ocorrência.' });
  }
};
