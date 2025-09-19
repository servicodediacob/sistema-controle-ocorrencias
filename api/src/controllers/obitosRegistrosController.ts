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
 */
export const getObitosPorData = async (req: Request, res: Response) => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    // CORREÇÃO: Adicionado 'return' para garantir que a função pare aqui.
    return res.status(400).json({ message: 'A data é obrigatória.' });
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
      ORDER BY n.subgrupo, obr.id;
    `;
    const { rows } = await db.query(query, [data]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar registros de óbito:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Cria um novo registro de óbito.
 */
export const criarObitoRegistro = async (req: Request, res: Response) => {
  const payload = req.body as ObitoRegistroPayload;
  const usuario_id = req.usuario?.id;

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
      payload.numero_ocorrencia,
      payload.obm_responsavel,
      payload.quantidade_vitimas,
      usuario_id
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar registro de óbito:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Atualiza um registro de óbito existente.
 */
export const atualizarObitoRegistro = async (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Não implementado.' });
};

/**
 * @description Exclui um registro de óbito.
 */
export const deletarObitoRegistro = async (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Não implementado.' });
};
