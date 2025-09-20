// backend/src/controllers/dadosController.ts

import { Request, Response } from 'express';
import db from '../db';

// ===============================================
// NATUREZAS DE OCORRÊNCIA
// ===============================================

export const getNaturezas = async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, grupo, subgrupo FROM naturezas_ocorrencia ORDER BY grupo, subgrupo ASC');
    return res.status(200).json(rows); // Adicionado return
  } catch (error) {
    console.error('Erro ao buscar naturezas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao buscar naturezas.' }); // Adicionado return
  }
};

export const getNaturezasPorNomes = async (req: Request, res: Response) => {
  const { nomes } = req.body;

  if (!Array.isArray(nomes) || nomes.length === 0) {
    return res.status(400).json({ message: 'Um array de nomes de subgrupo é obrigatório.' });
  }

  try {
    const inPlaceholders = nomes.map((_, index) => `$${index + 1}`).join(', ');
    const casePlaceholders = nomes.map((_, index) => `WHEN $${nomes.length + index + 1} THEN ${index}`).join(' ');

    const query = `
      SELECT id, subgrupo 
      FROM naturezas_ocorrencia 
      WHERE subgrupo IN (${inPlaceholders})
      ORDER BY CASE subgrupo ${casePlaceholders} END;
    `;
    
    const values = [...nomes, ...nomes];
    const { rows } = await db.query(query, values);
    
    return res.status(200).json(rows); // Adicionado return
  } catch (error) {
    console.error('Erro ao buscar naturezas por nomes:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' }); // Adicionado return
  }
};

export const criarNatureza = async (req: Request, res: Response) => {
  const { grupo, subgrupo } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
  }
  try {
    const query = 'INSERT INTO naturezas_ocorrencia (grupo, subgrupo) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [grupo, subgrupo]);
    return res.status(201).json(rows[0]); // Adicionado return
  } catch (error) {
    if ((error as any).code === '23505') {
        return res.status(409).json({ message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.` }); // Adicionado return
    }
    console.error('Erro ao criar natureza:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao criar natureza.' }); // Adicionado return
  }
};

export const atualizarNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { grupo, subgrupo } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
  }
  try {
    const query = 'UPDATE naturezas_ocorrencia SET grupo = $1, subgrupo = $2 WHERE id = $3 RETURNING *';
    const { rows } = await db.query(query, [grupo, subgrupo, id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Natureza não encontrada.' });
    }
    return res.status(200).json(rows[0]); // Adicionado return
  } catch (error) {
    if ((error as any).code === '23505') {
        return res.status(409).json({ message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.` }); // Adicionado return
    }
    console.error('Erro ao atualizar natureza:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao atualizar natureza.' }); // Adicionado return
  }
};

export const excluirNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM naturezas_ocorrencia WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Natureza não encontrada.' });
    }
    return res.status(200).json({ message: 'Natureza excluída com sucesso.' }); // Adicionado return
  } catch (error) {
    if ((error as any).code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir esta natureza, pois ela está associada a ocorrências existentes.' }); // Adicionado return
    }
    console.error('Erro ao excluir natureza:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao excluir natureza.' }); // Adicionado return
  }
};


// --- OCORRÊNCIAS ---
// (As funções abaixo também foram corrigidas com 'return' para consistência)

export const criarOcorrencia = async (req: Request, res: Response) => {
  const { ocorrencia, obitos } = req.body;

  if (!ocorrencia || !ocorrencia.cidade_id || !ocorrencia.natureza_id || !ocorrencia.data_ocorrencia) {
    return res.status(400).json({ message: 'Dados da ocorrência incompletos. Cidade, Natureza e Data são obrigatórios.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const queryOcorrencia = `
      INSERT INTO ocorrencias (data_ocorrencia, natureza_id, cidade_id, quantidade_obitos)
      VALUES ($1, $2, $3, $4)
      RETURNING id; 
    `;
    const ocorrenciaValues = [
      ocorrencia.data_ocorrencia,
      ocorrencia.natureza_id,
      ocorrencia.cidade_id,
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
    return res.status(201).json({ 
      message: 'Ocorrência e óbitos registrados com sucesso!',
      ocorrenciaId: novaOcorrenciaId 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar ocorrência (transação revertida):', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao registrar a ocorrência.' });

  } finally {
    client.release();
  }
};

export const getOcorrencias = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const ocorrenciasQuery = `
      SELECT 
        o.id, o.data_ocorrencia, o.quantidade_obitos, o.natureza_id, o.cidade_id,
        CONCAT(n.grupo, ' - ', n.subgrupo) AS natureza_descricao,
        c.nome AS cidade_nome, 
        cr.nome AS crbm_nome
      FROM ocorrencias o
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      JOIN cidades c ON o.cidade_id = c.id
      JOIN crbms cr ON c.crbm_id = cr.id
      ORDER BY o.data_ocorrencia DESC, o.id DESC
      LIMIT $1 OFFSET $2;
    `;
    
    const { rows: ocorrencias } = await db.query(ocorrenciasQuery, [limit, offset]);

    const totalQuery = 'SELECT COUNT(*) FROM ocorrencias;';
    const { rows: totalRows } = await db.query(totalQuery);
    const total = parseInt(totalRows[0].count, 10);

    return res.status(200).json({
      ocorrencias,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('Erro ao buscar ocorrências:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao buscar ocorrências.' });
  }
};

export const updateOcorrencia = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data_ocorrencia, natureza_id, cidade_id } = req.body;

  if (!data_ocorrencia || !natureza_id || !cidade_id) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios para atualização.' });
  }

  try {
    const query = `
      UPDATE ocorrencias SET data_ocorrencia = $1, natureza_id = $2, cidade_id = $3
      WHERE id = $4 RETURNING *;
    `;
    const { rows } = await db.query(query, [data_ocorrencia, natureza_id, cidade_id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência não encontrada.' });
    }

    return res.status(200).json({ message: 'Ocorrência atualizada com sucesso!', ocorrencia: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar ocorrência:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao atualizar a ocorrência.' });
  }
};

export const deleteOcorrencia = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM ocorrencias WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ocorrência não encontrada.' });
    }

    return res.status(200).json({ message: 'Ocorrência excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir ocorrência:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao excluir a ocorrência.' });
  }
};

// -- FIM -- //