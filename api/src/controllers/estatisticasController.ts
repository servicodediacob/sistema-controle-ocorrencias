import { Request, Response } from 'express';
import db from '../db';

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

  // Validação inicial dos dados recebidos.
  if (!data_registro || !cidade_id || !estatisticas) {
    res.status(400).json({ message: 'Dados incompletos. data_registro, cidade_id e estatisticas são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    // Inicia uma transação. Ou tudo funciona, ou nada é salvo.
    await client.query('BEGIN');

    // Query base para inserir um novo registro na tabela principal 'ocorrencias'.
    // Assumimos 0 óbitos para lançamentos em lote, pois o formulário não tem campo para isso.
    const query = `
      INSERT INTO ocorrencias (data_ocorrencia, cidade_id, natureza_id, quantidade_obitos)
      VALUES ($1, $2, $3, 0);
    `;

    let totalOcorrenciasCriadas = 0;

    // Itera sobre cada tipo de estatística enviada do formulário.
    // Ex: { natureza_id: 5, quantidade: 3 }
    for (const stat of estatisticas) {
      // Converte a quantidade para número e valida se é um valor positivo.
      const quantidade = Number(stat.quantidade);
      if (!quantidade || quantidade <= 0) {
        continue; // Pula para a próxima estatística se a quantidade for zero ou inválida.
      }

      // Cria um loop para executar a query de inserção 'N' vezes,
      // onde 'N' é a quantidade informada pelo usuário.
      for (let i = 0; i < quantidade; i++) {
        const values = [data_registro, cidade_id, stat.natureza_id];
        await client.query(query, values);
        totalOcorrenciasCriadas++;
      }
    }

    // Se, após iterar por tudo, nenhum registro foi criado (ex: todas as quantidades eram 0),
    // informamos o usuário e revertemos a transação.
    if (totalOcorrenciasCriadas === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Nenhuma ocorrência para registrar. As quantidades devem ser maiores que zero.' });
        return;
    }

    // Se tudo deu certo, efetiva as alterações no banco de dados.
    await client.query('COMMIT');
    res.status(201).json({ message: `${totalOcorrenciasCriadas} ocorrência(s) registrada(s) com sucesso!` });

  } catch (error) {
    // Em caso de qualquer erro no meio do processo, desfaz todas as alterações.
    await client.query('ROLLBACK');
    console.error('Erro ao registrar ocorrências em lote (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar as ocorrências.' });

  } finally {
    // Libera a conexão com o banco de dados de volta para o pool.
    client.release();
  }
};


/**
 * @description Gera um relatório de estatísticas agrupado por natureza e CRBM para um intervalo de datas.
 * @note Esta função ainda lê da tabela 'estatisticas_diarias'. Se essa tabela não for mais usada,
 *       esta função precisará ser adaptada para ler da tabela 'ocorrencias'.
 */
export const getRelatorioEstatisticas = async (req: Request, res: Response): Promise<void> => {
  const { data_inicio, data_fim } = req.query;

  if (!data_inicio || !data_fim) {
    res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    return;
  }

  try {
    // ATENÇÃO: Esta query ainda usa a tabela 'estatisticas_diarias'.
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
