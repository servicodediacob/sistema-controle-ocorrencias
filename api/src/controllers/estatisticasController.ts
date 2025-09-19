import { Request, Response } from 'express'; // <-- CORREÇÃO: Importações adicionadas
import db from '../db';                     // <-- CORREÇÃO: Importações adicionadas

// A interface do payload recebido do frontend não precisa mudar.
interface EstatisticaPayload {
  data_registro: string;
  cidade_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

/**
 * @description Registra um lote de ocorrências na tabela 'ocorrencias',
 *              criando um registro para cada unidade de 'quantidade' informada.
 *              Isso alimenta diretamente o Dashboard.
 *              Usa uma transação para garantir a integridade dos dados.
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
      // CORREÇÃO: Usando a função Number() corretamente
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
 *              Esta é a nova versão, consistente com o Dashboard.
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
