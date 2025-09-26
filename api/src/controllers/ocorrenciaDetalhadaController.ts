// Caminho: api/src/controllers/ocorrenciaDetalhadaController.ts

import { Request, Response } from 'express';
import { RequestWithUser } from '../middleware/authMiddleware';
import db from '../db';

// Interface para o payload de criação/atualização
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

// Controller para criar uma nova ocorrência detalhada
export const criarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const payload: OcorrenciaDetalhadaPayload = req.body;
  const usuario_id = req.usuario?.id;

  try {
    const query = `
      INSERT INTO ocorrencias_detalhadas 
        (numero_ocorrencia, natureza_id, endereco, bairro, cidade_id, viaturas, veiculos_envolvidos, dados_vitimas, resumo_ocorrencia, data_ocorrencia, horario_ocorrencia, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      payload.numero_ocorrencia, payload.natureza_id, payload.endereco, payload.bairro, payload.cidade_id,
      payload.viaturas, payload.veiculos_envolvidos, payload.dados_vitimas, payload.resumo_ocorrencia,
      payload.data_ocorrencia, payload.horario_ocorrencia, usuario_id
    ];
    
    const { rows } = await db.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar ocorrência detalhada:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Controller para buscar ocorrências detalhadas por data
export const getOcorrenciasDetalhadasPorData = async (req: Request, res: Response) => {
  const { data_ocorrencia } = req.query;

  if (!data_ocorrencia || typeof data_ocorrencia !== 'string') {
    return res.status(400).json({ message: 'O parâmetro "data_ocorrencia" é obrigatório.' });
  }

  try {
    // ======================= INÍCIO DA CORREÇÃO =======================
    // A query agora seleciona também 'natureza_id' e 'cidade_id'
    const query = `
      SELECT 
        od.id,
        od.numero_ocorrencia,
        od.natureza_id,
        n.subgrupo as natureza_nome,
        od.endereco,
        od.bairro,
        od.cidade_id,
        c.nome as cidade_nome,
        od.viaturas,
        od.veiculos_envolvidos,
        od.dados_vitimas,
        od.resumo_ocorrencia,
        od.data_ocorrencia,
        od.horario_ocorrencia,
        od.usuario_id
      FROM ocorrencias_detalhadas od
      JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      JOIN obms c ON od.cidade_id = c.id
      WHERE od.data_ocorrencia = $1
      ORDER BY od.horario_ocorrencia ASC, od.id ASC;
    `;
    // ======================= FIM DA CORREÇÃO =======================
    
    const { rows } = await db.query(query, [data_ocorrencia]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ocorrências detalhadas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Controller para atualizar uma ocorrência detalhada
export const atualizarOcorrenciaDetalhada = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload: OcorrenciaDetalhadaPayload = req.body;

  try {
    const query = `
      UPDATE ocorrencias_detalhadas SET
        numero_ocorrencia = $1, natureza_id = $2, endereco = $3, bairro = $4, cidade_id = $5,
        viaturas = $6, veiculos_envolvidos = $7, dados_vitimas = $8, resumo_ocorrencia = $9,
        data_ocorrencia = $10, horario_ocorrencia = $11
      WHERE id = $12
      RETURNING *;
    `;
    const values = [
      payload.numero_ocorrencia, payload.natureza_id, payload.endereco, payload.bairro, payload.cidade_id,
      payload.viaturas, payload.veiculos_envolvidos, payload.dados_vitimas, payload.resumo_ocorrencia,
      payload.data_ocorrencia, payload.horario_ocorrencia, id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar ocorrência detalhada:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Controller para deletar uma ocorrência detalhada
export const deletarOcorrenciaDetalhada = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM ocorrencias_detalhadas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
    }
    return res.status(200).json({ message: 'Ocorrência excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir ocorrência detalhada:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
