// backend/src/controllers/obitosRegistrosController.ts

import { Request, Response } from 'express';
import db from '../db';

interface ObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_responsavel: string;
  quantidade_vitimas: number;
}

// ... (a função getObitosPorData não precisa de alterações)
export const getObitosPorData = async (req: Request, res: Response) => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
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
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar registros de óbito:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


/**
 * @description Cria um novo registro de óbito.
 * (A LÓGICA DE CORREÇÃO ESTÁ AQUI)
 */
export const criarObitoRegistro = async (req: Request, res: Response) => {
  const payload = req.body as ObitoRegistroPayload;
  
  // 1. OBTENÇÃO SEGURA DO ID DO USUÁRIO
  // O ID do usuário vem do token decodificado pelo middleware 'proteger'.
  // Se 'req.usuario' não existir, usamos 'null'.
  const usuario_id = req.usuario?.id || null;

  // 2. VERIFICAÇÃO DE SEGURANÇA (OPCIONAL, MAS RECOMENDADO)
  // Se o ID do usuário for null, significa que algo está errado com a autenticação.
  if (usuario_id === null) {
    console.error('ERRO CRÍTICO: Tentativa de criar registro de óbito sem um usuário autenticado.');
    return res.status(401).json({ message: 'Usuário não autenticado. Faça login novamente.' });
  }

  try {
    // Busca o nome da cidade usando o ID recebido do frontend
    const cidadeResult = await db.query('SELECT nome FROM cidades WHERE id = $1', [payload.obm_responsavel]);
    
    if (cidadeResult.rows.length === 0) {
      return res.status(404).json({ message: 'A OBM (Cidade) selecionada não foi encontrada.' });
    }
    const nomeCidade = cidadeResult.rows[0].nome;

    // Insere o registro usando o nome da cidade e o ID do usuário obtido de forma segura
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
      nomeCidade, // Nome da cidade, como corrigido anteriormente
      payload.quantidade_vitimas,
      usuario_id  // ID do usuário obtido do token
    ];
    const { rows } = await db.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar registro de óbito:', error);
    // Verifica se o erro é o de chave estrangeira que vimos
    if ((error as any).code === '23503' && (error as any).constraint === 'fk_usuario_obito_registro') {
      return res.status(400).json({ message: `O usuário com ID ${usuario_id} não foi encontrado no banco de dados. Por favor, faça login novamente.` });
    }
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ... (as funções 'atualizarObitoRegistro' e 'deletarObitoRegistro' permanecem as mesmas)
export const atualizarObitoRegistro = async (_req: Request, res: Response) => {
    return res.status(501).json({ message: 'Não implementado.' });
};

export const deletarObitoRegistro = async (_req: Request, res: Response) => {
    return res.status(501).json({ message: 'Não implementado.' });
};
