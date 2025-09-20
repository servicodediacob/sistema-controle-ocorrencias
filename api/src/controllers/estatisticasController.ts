// Caminho: backend/src/controllers/estatisticasController.ts

import { Request, Response } from 'express';
import db from '../db';

interface EstatisticaPayload {
  data_registro: string;
  cidade_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

/**
 * @description Registra um lote de ocorrências na tabela 'ocorrencias'.
 */
export const registrarEstatisticas = async (req: Request, res: Response): Promise<void> => {
  const { data_registro, cidade_id, estatisticas } = req.body as EstatisticaPayload;

  if (!data_registro || !cidade_id || !estatisticas) {
    res.status(400).json({ message: 'Dados incompletos. data_registro, cidade_id e estatisticas são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO ocorrencias (data_ocorrencia, cidade_id, natureza_id, quantidade_obitos)
      VALUES ($1, $2, $3, 0);
    `;

    let totalOcorrenciasCriadas = 0;

    for (const stat of estatisticas) {
      const quantidade = Number(stat.quantidade);
      if (!quantidade || quantidade <= 0) {
        continue;
      }

      for (let i = 0; i < quantidade; i++) {
        const values = [data_registro, cidade_id, stat.natureza_id];
        await client.query(query, values);
        totalOcorrenciasCriadas++;
      }
    }

    if (totalOcorrenciasCriadas === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Nenhuma ocorrência para registrar. As quantidades devem ser maiores que zero.' });
        return;
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `${totalOcorrenciasCriadas} ocorrência(s) registrada(s) com sucesso!` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar ocorrências em lote (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar as ocorrências.' });

  } finally {
    client.release();
  }
};

/**
 * @description Gera um relatório de estatísticas lendo da tabela 'ocorrencias'.
 */
export const getRelatorioEstatisticas = async (req: Request, res: Response): Promise<void> => {
  const { data_inicio, data_fim } = req.query;

  if (!data_inicio || !data_fim) {
    res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    return;
  }

  try {
    const query = `
      SELECT
        n.grupo,
        n.subgrupo,
        COUNT(CASE WHEN c.nome LIKE 'Goiânia Diurno' THEN o.id ELSE NULL END) AS "diurno",
        COUNT(CASE WHEN c.nome LIKE 'Goiânia Noturno' THEN o.id ELSE NULL END) AS "noturno",
        COUNT(CASE WHEN c.nome LIKE 'Goiânia%' THEN o.id ELSE NULL END) AS "total_capital",
        COUNT(CASE WHEN cr.nome = '1º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN o.id ELSE NULL END) AS "1º CRBM",
        COUNT(CASE WHEN cr.nome = '2º CRBM' THEN o.id ELSE NULL END) AS "2º CRBM",
        COUNT(CASE WHEN cr.nome = '3º CRBM' THEN o.id ELSE NULL END) AS "3º CRBM",
        COUNT(CASE WHEN cr.nome = '4º CRBM' THEN o.id ELSE NULL END) AS "4º CRBM",
        COUNT(CASE WHEN cr.nome = '5º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN o.id ELSE NULL END) AS "5º CRBM",
        COUNT(CASE WHEN cr.nome = '6º CRBM' THEN o.id ELSE NULL END) AS "6º CRBM",
        COUNT(CASE WHEN cr.nome = '7º CRBM' THEN o.id ELSE NULL END) AS "7º CRBM",
        COUNT(CASE WHEN cr.nome = '8º CRBM' THEN o.id ELSE NULL END) AS "8º CRBM",
        COUNT(CASE WHEN cr.nome = '9º CRBM' THEN o.id ELSE NULL END) AS "9º CRBM",
        COUNT(o.id) AS "total_geral"
      FROM ocorrencias o
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      JOIN cidades c ON o.cidade_id = c.id
      JOIN crbms cr ON c.crbm_id = cr.id
      WHERE o.data_ocorrencia BETWEEN $1 AND $2
      GROUP BY n.grupo, n.subgrupo
      ORDER BY n.grupo, n.subgrupo;
    `;
    const { rows } = await db.query(query, [data_inicio, data_fim]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.' });
  }
};

/**
 * @description Busca as estatísticas de uma data, agrupadas por cidade e natureza.
 */
export const getEstatisticasPorData = async (req: Request, res: Response): Promise<void> => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória.' });
    return;
  }

  try {
    const query = `
      SELECT 
        cr.nome as crbm_nome,
        c.nome as cidade_nome,
        n.subgrupo as natureza_nome,
        n.abreviacao as natureza_abreviacao,
        COUNT(o.id)::int as quantidade
      FROM ocorrencias o
      JOIN cidades c ON o.cidade_id = c.id
      JOIN crbms cr ON c.crbm_id = cr.id
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      WHERE o.data_ocorrencia = $1
        AND n.grupo != 'Relatório de Óbitos'
      GROUP BY cr.nome, c.nome, n.subgrupo, n.abreviacao
      ORDER BY cr.nome, c.nome, n.subgrupo;
    `;
    const { rows } = await db.query(query, [data]);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Erro ao buscar estatísticas por data:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @description Limpa (deleta) todas as ocorrências de uma data específica.
 */
export const limparEstatisticasPorData = async (req: Request, res: Response): Promise<void> => {
  const { data } = req.query;

  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória para limpar os registros.' });
    return;
  }

  try {
    const result = await db.query(
      `DELETE FROM ocorrencias 
       WHERE data_ocorrencia = $1 
       AND natureza_id NOT IN (SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos')`, 
      [data]
    );
    
    res.status(200).json({ message: `Operação concluída. ${result.rowCount} registros de ocorrência foram excluídos.` });

  } catch (error) {
    console.error('Erro ao limpar estatísticas por data:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao limpar os registros.' });
  }
};
