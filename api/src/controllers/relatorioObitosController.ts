// backend/src/controllers/relatorioObitosController.ts

import { Request, Response } from 'express';
import db from '../db';

interface ObitoRelatorioPayload {
  data_relatorio: string;
  dados: {
    natureza_id: number;
    quantidade: number;
    rai_obm_info: string;
  }[];
}

/**
 * @description Busca os dados do relatório de óbitos para uma data específica.
 */
export const getRelatorioObitos = async (req: Request, res: Response): Promise<void> => {
  const { data } = req.query;

  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data do relatório é obrigatória.' });
    return;
  }

  try {
    const query = `
      SELECT 
        n.id as natureza_id,
        n.grupo,
        n.subgrupo,
        COALESCE(obr.quantidade, 0) as quantidade,
        COALESCE(obr.rai_obm_info, '') as rai_obm_info
      FROM naturezas_ocorrencia n
      LEFT JOIN obitos_relatorio obr ON n.id = obr.natureza_id AND obr.data_relatorio = $1
      ORDER BY n.grupo, n.subgrupo;
    `;
    const { rows } = await db.query(query, [data]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar relatório de óbitos:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Salva (insere ou atualiza) os dados do relatório de óbitos.
 */
export const saveRelatorioObitos = async (req: Request, res: Response): Promise<void> => {
  const { data_relatorio, dados } = req.body as ObitoRelatorioPayload;
  const usuario_id = req.usuario?.id;

  if (!data_relatorio || !dados) {
    res.status(400).json({ message: 'Dados incompletos.' });
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO obitos_relatorio (data_relatorio, natureza_id, quantidade, rai_obm_info, usuario_id, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (data_relatorio, natureza_id) 
      DO UPDATE SET
        quantidade = EXCLUDED.quantidade,
        rai_obm_info = EXCLUDED.rai_obm_info,
        usuario_id = EXCLUDED.usuario_id,
        atualizado_em = CURRENT_TIMESTAMP;
    `;

    for (const item of dados) {
      await client.query(query, [data_relatorio, item.natureza_id, item.quantidade, item.rai_obm_info, usuario_id]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Relatório de óbitos salvo com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar relatório de óbitos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao salvar o relatório.' });
  } finally {
    client.release();
  }
};
