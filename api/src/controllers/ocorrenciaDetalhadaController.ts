// Caminho: api/src/controllers/ocorrenciaDetalhadaController.ts

import { Request, Response } from 'express';
import db from '../db';
import logger from '../config/logger';

// A interface RequestWithUser não é mais importada aqui

export const criarOcorrenciaDetalhada = async (req: Request, res: Response): Promise<void> => {
  // ======================= INÍCIO DA CORREÇÃO =======================
  // Forçamos o tipo 'any' para acessar a propriedade 'usuario' injetada pelo middleware
  const usuario_id = (req as any).usuario?.id;
  // ======================= FIM DA CORREÇÃO =======================

  const {
    numero_ocorrencia, natureza_id, endereco, bairro, cidade_id,
    viaturas, veiculos_envolvidos, dados_vitimas, resumo_ocorrencia,
    data_ocorrencia, horario_ocorrencia
  } = req.body;

  if (!natureza_id || !cidade_id || !data_ocorrencia || !resumo_ocorrencia) {
    res.status(400).json({ message: 'Campos obrigatórios não preenchidos: Natureza, Cidade, Data e Resumo.' });
    return;
  }

  try {
    const query = `
      INSERT INTO ocorrencias_detalhadas (
        numero_ocorrencia, natureza_id, endereco, bairro, cidade_id,
        viaturas, veiculos_envolvidos, dados_vitimas, resumo_ocorrencia,
        data_ocorrencia, horario_ocorrencia, usuario_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const values = [
      numero_ocorrencia || null, natureza_id, endereco || null, bairro || null, cidade_id,
      viaturas || null, veiculos_envolvidos || null, dados_vitimas || null, resumo_ocorrencia,
      data_ocorrencia, horario_ocorrencia || null, usuario_id
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);

  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao criar ocorrência detalhada.');
    res.status(500).json({ message: 'Erro interno do servidor ao criar ocorrência.' });
  }
};

export const getOcorrenciasDetalhadasPorData = async (req: Request, res: Response): Promise<void> => {
  const { data } = req.query;

  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'O parâmetro "data" é obrigatório.' });
    return;
  }

  try {
    const query = `
      SELECT 
        od.*,
        n.subgrupo as natureza_nome,
        o.nome as cidade_nome
      FROM ocorrencias_detalhadas od
      JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      JOIN obms o ON od.cidade_id = o.id
      WHERE od.data_ocorrencia = $1
      ORDER BY od.criado_em DESC;
    `;
    const { rows } = await db.query(query, [data as string]);
    res.status(200).json(rows);

  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao buscar ocorrências detalhadas.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
