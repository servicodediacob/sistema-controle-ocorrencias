// Caminho: api/src/controllers/obitosRegistrosController.ts

import { Response } from 'express';
import { RequestWithUser } from '../middleware/authMiddleware';
import db from '../db';

interface ObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_id: number; // A interface já espera 'obm_id', o que está correto.
  quantidade_vitimas: number;
}

export const getObitosPorData = async (req: RequestWithUser, res: Response) => {
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
        o.nome as obm_nome,
        obr.obm_id,
        obr.quantidade_vitimas
      FROM obitos_registros obr
      JOIN naturezas_ocorrencia n ON obr.natureza_id = n.id
      LEFT JOIN obms o ON obr.obm_id = o.id
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

export const criarObitoRegistro = async (req: RequestWithUser, res: Response) => {
  // Desestruturação agora lê 'obm_id' diretamente do corpo da requisição.
  const { 
    data_ocorrencia, 
    natureza_id, 
    numero_ocorrencia, 
    obm_id, // Lendo o campo correto
    quantidade_vitimas 
  } = req.body as ObitoRegistroPayload;
  const usuario_id = req.usuario?.id || null;

  if (usuario_id === null) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    const obitoRegistroQuery = `
      INSERT INTO obitos_registros 
        (data_ocorrencia, natureza_id, numero_ocorrencia, obm_id, quantidade_vitimas, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const obitoRegistroValues = [
      data_ocorrencia,
      natureza_id,
      numero_ocorrencia,
      obm_id, // Usando a variável correta
      quantidade_vitimas,
      usuario_id
    ];
    
    const { rows } = await db.query(obitoRegistroQuery, obitoRegistroValues);
    return res.status(201).json(rows[0]);

  } catch (error) {
    console.error('Erro ao criar registro de óbito:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return res.status(500).json({ message });
  }
};

export const atualizarObitoRegistro = async (req: RequestWithUser, res: Response) => {
    const { id } = req.params;
    const { 
      data_ocorrencia, 
      natureza_id, 
      numero_ocorrencia, 
      obm_id, // Lendo o campo correto
      quantidade_vitimas 
    } = req.body as ObitoRegistroPayload;
    const usuario_id = req.usuario?.id || null;

    if (usuario_id === null) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        const query = `
            UPDATE obitos_registros SET
                data_ocorrencia = $1,
                natureza_id = $2,
                numero_ocorrencia = $3,
                obm_id = $4,
                quantidade_vitimas = $5,
                usuario_id = $6
            WHERE id = $7
            RETURNING *;
        `;
        const values = [
            data_ocorrencia,
            natureza_id,
            numero_ocorrencia,
            obm_id, // Usando a variável correta
            quantidade_vitimas,
            usuario_id,
            id
        ];

        const { rows } = await db.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        }
        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar registro de óbito:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const deletarObitoRegistro = async (req: RequestWithUser, res: Response) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM obitos_registros WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        return res.status(200).json({ message: 'Registro excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir registro de óbito:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const limparRegistrosPorData = async (req: RequestWithUser, res: Response) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') return res.status(400).json({ message: 'A data é obrigatória.' });
    try {
        const result = await db.query('DELETE FROM obitos_registros WHERE data_ocorrencia = $1', [data as string]);
        return res.status(200).json({ message: `Operação concluída. ${result.rowCount} registros foram excluídos.` });
    } catch (error) {
        console.error('Erro ao limpar registros de óbito por data:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
