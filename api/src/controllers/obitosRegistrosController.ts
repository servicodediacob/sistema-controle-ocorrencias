import { Request, Response } from 'express';
import db from '../db';

// Interface para o payload de criação/atualização
interface ObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_responsavel: string;
  quantidade_vitimas: number;
}

/**
 * @description Lista todos os registros de óbito para uma data específica.
 * @route GET /api/obitos-registros
 */
export const getObitosPorData = async (req: Request, res: Response): Promise<void> => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória.' });
    return;
  }

  try {
    const query = `
      SELECT 
        obr.id,
        obr.data_ocorrencia,
        obr.natureza_id,
        n.subgrupo as natureza_nome,
        obr.numero_ocorrencia,
        obr.obm_responsavel,
        obr.quantidade_vitimas
      FROM obitos_registros obr
      JOIN naturezas_ocorrencia n ON obr.natureza_id = n.id
      WHERE obr.data_ocorrencia = $1
      ORDER BY obr.id ASC;
    `;
    const { rows } = await db.query(query, [data]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar registros de óbito:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar registros de óbito.' });
  }
};

/**
 * @description Cria um novo registro de óbito.
 * @route POST /api/obitos-registros
 */
export const criarObitoRegistro = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as ObitoRegistroPayload;
  const usuario_id = req.usuario?.id;

  if (!payload.data_ocorrencia || !payload.natureza_id || payload.quantidade_vitimas == null) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes: data, natureza e quantidade de vítimas.' });
      return;
  }

  try {
    const query = `
      INSERT INTO obitos_registros 
        (data_ocorrencia, natureza_id, numero_ocorrencia, obm_responsavel, quantidade_vitimas, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      payload.data_ocorrencia,
      payload.natureza_id,
      payload.numero_ocorrencia || null,
      payload.obm_responsavel || null,
      payload.quantidade_vitimas,
      usuario_id
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar registro de óbito:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar registro de óbito.' });
  }
};

/**
 * @description Atualiza um registro de óbito existente.
 * @route PUT /api/obitos-registros/:id
 */
export const atualizarObitoRegistro = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ message: 'Funcionalidade de atualizar não implementada.' });
};

/**
 * @description Exclui um registro de óbito.
 * @route DELETE /api/obitos-registros/:id
 */
export const deletarObitoRegistro = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: 'O ID do registro é obrigatório.' });
    return;
  }

  try {
    const result = await db.query('DELETE FROM obitos_registros WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Registro de óbito não encontrado.' });
      return;
    }

    res.status(200).json({ message: 'Registro de óbito excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir registro de óbito:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao excluir o registro.' });
  }
};
