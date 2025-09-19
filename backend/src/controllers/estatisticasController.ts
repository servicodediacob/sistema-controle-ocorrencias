import { Request, Response } from 'express';
import db from '../db';

// Interface para definir o formato dos dados que esperamos receber do formulário
interface EstatisticaPayload {
  data_registro: string;
  cidade_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

/**
 * @description Registra um lote de estatísticas, usando uma transação para garantir a integridade dos dados.
 */
export const registrarEstatisticas = async (req: Request, res: Response): Promise<void> => {
  const { data_registro, cidade_id, estatisticas } = req.body as EstatisticaPayload;
  // A propriedade 'usuario' é adicionada pelo nosso middleware 'proteger'
  const usuario_id = req.usuario?.id;

  if (!data_registro || !cidade_id || !estatisticas) {
    res.status(400).json({ message: 'Dados incompletos. data_registro, cidade_id e estatisticas são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const stat of estatisticas) {
      if (!stat.quantidade || stat.quantidade <= 0) {
        continue;
      }

      const query = `
        INSERT INTO estatisticas_diarias (data_registro, cidade_id, natureza_id, quantidade, usuario_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (data_registro, cidade_id, natureza_id)
        DO UPDATE SET 
          quantidade = EXCLUDED.quantidade, 
          usuario_id = EXCLUDED.usuario_id,
          criado_em = CURRENT_TIMESTAMP;
      `;
      
      const values = [data_registro, cidade_id, stat.natureza_id, stat.quantidade, usuario_id];
      await client.query(query, values);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Estatísticas registradas com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar estatísticas (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar as estatísticas.' });

  } finally {
    client.release();
  }
};

/**
 * @description Gera um relatório de estatísticas agrupado por natureza e CRBM para um intervalo de datas.
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
        -- Agregações para a Capital
        SUM(CASE WHEN c.nome LIKE 'Goiânia Diurno' THEN es.quantidade ELSE 0 END) AS "diurno",
        SUM(CASE WHEN c.nome LIKE 'Goiânia Noturno' THEN es.quantidade ELSE 0 END) AS "noturno",
        SUM(CASE WHEN c.nome LIKE 'Goiânia%' THEN es.quantidade ELSE 0 END) AS "total_capital",
        
        -- Agregações por CRBM para o Interior
        SUM(CASE WHEN cr.nome = '1º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN es.quantidade ELSE 0 END) AS "1º CRBM",
        SUM(CASE WHEN cr.nome = '2º CRBM' THEN es.quantidade ELSE 0 END) AS "2º CRBM",
        SUM(CASE WHEN cr.nome = '3º CRBM' THEN es.quantidade ELSE 0 END) AS "3º CRBM",
        SUM(CASE WHEN cr.nome = '4º CRBM' THEN es.quantidade ELSE 0 END) AS "4º CRBM",
        SUM(CASE WHEN cr.nome = '5º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN es.quantidade ELSE 0 END) AS "5º CRBM",
        SUM(CASE WHEN cr.nome = '6º CRBM' THEN es.quantidade ELSE 0 END) AS "6º CRBM",
        SUM(CASE WHEN cr.nome = '7º CRBM' THEN es.quantidade ELSE 0 END) AS "7º CRBM",
        SUM(CASE WHEN cr.nome = '8º CRBM' THEN es.quantidade ELSE 0 END) AS "8º CRBM",
        SUM(CASE WHEN cr.nome = '9º CRBM' THEN es.quantidade ELSE 0 END) AS "9º CRBM",

        -- Total Geral
        SUM(es.quantidade) AS "total_geral"
      FROM estatisticas_diarias es
      JOIN naturezas_ocorrencia n ON es.natureza_id = n.id
      JOIN cidades c ON es.cidade_id = c.id
      JOIN crbms cr ON c.crbm_id = cr.id
      WHERE es.data_registro BETWEEN $1 AND $2
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
