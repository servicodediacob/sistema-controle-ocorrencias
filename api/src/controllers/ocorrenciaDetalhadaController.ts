import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import logger from '@/config/logger';

interface OcorrenciaDetalhadaPayload {
  numero_ocorrencia?: string;
  natureza_id: number;
  endereco?: string;
  bairro?: string;
  cidade_id: number;
  viaturas?: string;
  veiculos_envolvidos?: string;
  dados_vitimas?: string;
  resumo_ocorrencia: string;
  data_ocorrencia: string;
  horario_ocorrencia?: string;
}

export const criarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const payload: OcorrenciaDetalhadaPayload = req.body;
  const usuario_id = req.usuario?.id;
  
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const queryInsert = `
      INSERT INTO ocorrencias_detalhadas 
        (numero_ocorrencia, natureza_id, endereco, bairro, cidade_id, viaturas, veiculos_envolvidos, dados_vitimas, resumo_ocorrencia, data_ocorrencia, horario_ocorrencia, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      payload.numero_ocorrencia, payload.natureza_id, payload.endereco, payload.bairro, payload.cidade_id,
      payload.viaturas, payload.veiculos_envolvidos, payload.dados_vitimas, payload.resumo_ocorrencia,
      payload.data_ocorrencia, payload.horario_ocorrencia || null, usuario_id
    ];
    
    const result = await client.query(queryInsert, values);
    const novaOcorrencia = result.rows[0];

    const queryUpdateDestaque = 'UPDATE ocorrencia_destaque SET ocorrencia_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1';
    await client.query(queryUpdateDestaque, [novaOcorrencia.id]);

    await client.query('COMMIT');
    
    logger.info({ ocorrenciaId: novaOcorrencia.id, usuarioId: usuario_id }, 'Ocorrência detalhada criada e definida como destaque.');
    return res.status(201).json(novaOcorrencia);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error, payload }, 'Erro ao criar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};

export const getOcorrenciasDetalhadasPorData = async (req: RequestWithUser, res: Response) => {
  const { data_ocorrencia } = req.query;

  if (!data_ocorrencia || typeof data_ocorrencia !== 'string') {
    return res.status(400).json({ message: 'O parâmetro "data_ocorrencia" é obrigatório.' });
  }

  try {
    const query = `
      SELECT 
        od.id, od.numero_ocorrencia, od.natureza_id, n.subgrupo as natureza_nome,
        od.endereco, od.bairro, od.cidade_id, c.nome as cidade_nome, od.viaturas,
        od.veiculos_envolvidos, od.dados_vitimas, od.resumo_ocorrencia,
        od.data_ocorrencia, od.horario_ocorrencia, od.usuario_id
      FROM ocorrencias_detalhadas od
      JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      JOIN obms c ON od.cidade_id = c.id
      WHERE od.data_ocorrencia = $1
      ORDER BY od.horario_ocorrencia ASC, od.id ASC;
    `;
    
    const { rows } = await db.query(query, [data_ocorrencia]);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error, data: data_ocorrencia }, 'Erro ao buscar ocorrências detalhadas.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const payload: OcorrenciaDetalhadaPayload = req.body;

  try {
    const query = `
      UPDATE ocorrencias_detalhadas SET
        numero_ocorrencia = $1, natureza_id = $2, endereco = $3, bairro = $4, cidade_id = $5,
        viaturas = $6, veiculos_envolvidos = $7, dados_vitimas = $8, resumo_ocorrencia = $9,
        data_ocorrencia = $10, horario_ocorrencia = $11, usuario_id = $12
      WHERE id = $13
      RETURNING *;
    `;
    const values = [
      payload.numero_ocorrencia, payload.natureza_id, payload.endereco, payload.bairro, payload.cidade_id,
      payload.viaturas, payload.veiculos_envolvidos, payload.dados_vitimas, payload.resumo_ocorrencia,
      payload.data_ocorrencia, payload.horario_ocorrencia || null, req.usuario?.id, id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
    }
    logger.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada atualizada.');
    return res.status(200).json(rows[0]);
  } catch (error) {
    logger.error({ err: error, payload, ocorrenciaId: id }, 'Erro ao atualizar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const deletarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM ocorrencias_detalhadas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
    }
    logger.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada deletada.');
    return res.status(204).send(); // 204 No Content é mais apropriado para delete
  } catch (error) {
    logger.error({ err: error, ocorrenciaId: id }, 'Erro ao deletar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
