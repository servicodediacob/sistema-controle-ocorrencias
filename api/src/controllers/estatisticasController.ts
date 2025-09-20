import { Request, Response } from 'express';
import db from '../db';

interface EstatisticaPayload {
  data_registro: string;
  cidade_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

/**
 * @description Registra um lote de estatísticas na tabela 'estatisticas_diarias'.
 *              Usa uma transação e o comando ON CONFLICT para inserir ou atualizar os dados.
 *              Esta função NÃO afeta mais a tabela 'ocorrencias'.
 */
export const registrarEstatisticas = async (req: Request, res: Response): Promise<void> => {
  const { data_registro, cidade_id, estatisticas } = req.body as EstatisticaPayload;
  const usuario_id = req.usuario?.id;

  if (!data_registro || !cidade_id || !estatisticas) {
    res.status(400).json({ message: 'Dados incompletos. data_registro, cidade_id e estatisticas são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO estatisticas_diarias (data_registro, cidade_id, natureza_id, quantidade, usuario_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (data_registro, cidade_id, natureza_id)
      DO UPDATE SET 
        quantidade = estatisticas_diarias.quantidade + EXCLUDED.quantidade,
        usuario_id = EXCLUDED.usuario_id;
    `;

    let totalRegistrosProcessados = 0;

    for (const stat of estatisticas) {
      const quantidade = Number(stat.quantidade);
      if (!quantidade || quantidade <= 0) {
        continue;
      }

      const values = [data_registro, cidade_id, stat.natureza_id, quantidade, usuario_id];
      await client.query(query, values);
      totalRegistrosProcessados++;
    }

    if (totalRegistrosProcessados === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Nenhuma estatística para registrar. As quantidades devem ser maiores que zero.' });
        return;
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `Estatísticas registradas com sucesso!` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar estatísticas em lote (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar as estatísticas.' });

  } finally {
    client.release();
  }
};

/**
 * @description Gera um relatório de estatísticas lendo da tabela 'estatisticas_diarias'.
 *              Esta função agora é consistente com a nova lógica de inserção.
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
        SUM(CASE WHEN c.nome = 'Goiânia Diurno' THEN ed.quantidade ELSE 0 END) AS "diurno",
        SUM(CASE WHEN c.nome = 'Goiânia Noturno' THEN ed.quantidade ELSE 0 END) AS "noturno",
        SUM(CASE WHEN c.nome LIKE 'Goiânia%' THEN ed.quantidade ELSE 0 END) AS "total_capital",
        SUM(CASE WHEN cr.nome = '1º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN ed.quantidade ELSE 0 END) AS "1º CRBM",
        SUM(CASE WHEN cr.nome = '2º CRBM' THEN ed.quantidade ELSE 0 END) AS "2º CRBM",
        SUM(CASE WHEN cr.nome = '3º CRBM' THEN ed.quantidade ELSE 0 END) AS "3º CRBM",
        SUM(CASE WHEN cr.nome = '4º CRBM' THEN ed.quantidade ELSE 0 END) AS "4º CRBM",
        SUM(CASE WHEN cr.nome = '5º CRBM' AND c.nome NOT LIKE 'Goiânia%' THEN ed.quantidade ELSE 0 END) AS "5º CRBM",
        SUM(CASE WHEN cr.nome = '6º CRBM' THEN ed.quantidade ELSE 0 END) AS "6º CRBM",
        SUM(CASE WHEN cr.nome = '7º CRBM' THEN ed.quantidade ELSE 0 END) AS "7º CRBM",
        SUM(CASE WHEN cr.nome = '8º CRBM' THEN ed.quantidade ELSE 0 END) AS "8º CRBM",
        SUM(CASE WHEN cr.nome = '9º CRBM' THEN ed.quantidade ELSE 0 END) AS "9º CRBM",
        SUM(ed.quantidade) AS "total_geral"
      FROM estatisticas_diarias ed
      JOIN naturezas_ocorrencia n ON ed.natureza_id = n.id
      JOIN cidades c ON ed.cidade_id = c.id
      JOIN crbms cr ON c.crbm_id = cr.id
      WHERE ed.data_registro BETWEEN $1 AND $2
      GROUP BY n.grupo, n.subgrupo
      HAVING SUM(ed.quantidade) > 0 -- Mostra apenas linhas com totais
      ORDER BY n.grupo, n.subgrupo;
    `;
    const { rows } = await db.query(query, [data_inicio, data_fim]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.' });
  }
};
