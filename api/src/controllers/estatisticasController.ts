import { Response } from 'express';
// --- INÍCIO DA CORREÇÃO ---
// 1. Importamos a interface RequestWithUser que criamos no authMiddleware
import { RequestWithUser } from '../middleware/authMiddleware';
// --- FIM DA CORREÇÃO ---
import db from '../db';

interface EstatisticaPayload {
  data_registro: string;
  obm_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

// 2. Usamos a interface importada na assinatura da função
export const registrarEstatisticasLote = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { data_registro, obm_id, estatisticas } = req.body as EstatisticaPayload;
  const usuario_id = req.usuario?.id; // Agora o TypeScript entende esta linha

  if (!data_registro || !obm_id || !estatisticas) {
    res.status(400).json({ message: 'Dados incompletos. data_registro, obm_id e estatisticas são obrigatórios.' });
    return;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM estatisticas_diarias WHERE data_registro = $1 AND obm_id = $2`,
      [data_registro, obm_id]
    );

    const query = `
      INSERT INTO estatisticas_diarias (data_registro, obm_id, natureza_id, quantidade, usuario_id)
      VALUES ($1, $2, $3, $4, $5);
    `;

    let totalRegistrosCriados = 0;

    for (const stat of estatisticas) {
      const quantidade = Number(stat.quantidade);
      if (!quantidade || quantidade <= 0) continue;
      
      const values = [data_registro, obm_id, stat.natureza_id, quantidade, usuario_id];
      await client.query(query, values);
      totalRegistrosCriados++;
    }

    if (totalRegistrosCriados === 0) {
        await client.query('ROLLBACK');
        res.status(200).json({ message: 'Nenhuma estatística para registrar (quantidades zeradas). Registros anteriores para o dia e OBM foram limpos.' });
        return;
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `${totalRegistrosCriados} tipo(s) de estatística registrados com sucesso para a OBM!` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar estatísticas em lote (transação revertida):', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar as estatísticas.' });
  } finally {
    client.release();
  }
};

// O restante do arquivo (getRelatorioEstatisticas, etc.) não precisa de alteração,
// pois eles não usam req.usuario.
// ... (código restante do arquivo) ...
export const getRelatorioEstatisticas = async (req: RequestWithUser, res: Response): Promise<void> => {
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
        COALESCE(SUM(CASE WHEN o.nome = 'Goiânia - Diurno' THEN ed.quantidade ELSE 0 END), 0) AS diurno,
        COALESCE(SUM(CASE WHEN o.nome = 'Goiânia - Noturno' THEN ed.quantidade ELSE 0 END), 0) AS noturno,
        COALESCE(SUM(CASE WHEN o.crbm_id = (SELECT id FROM crbms WHERE nome = '1º CRBM') THEN ed.quantidade ELSE 0 END), 0) AS total_capital,
        COALESCE(SUM(CASE WHEN cr.nome = '1º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "1º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '2º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "2º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '3º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "3º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '4º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "4º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '5º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "5º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '6º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "6º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '7º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "7º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '8º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "8º CRBM",
        COALESCE(SUM(CASE WHEN cr.nome = '9º CRBM' THEN ed.quantidade ELSE 0 END), 0) AS "9º CRBM",
        COALESCE(SUM(ed.quantidade), 0) AS total_geral
      FROM naturezas_ocorrencia n
      LEFT JOIN estatisticas_diarias ed ON n.id = ed.natureza_id AND ed.data_registro BETWEEN $1 AND $2
      LEFT JOIN obms o ON ed.obm_id = o.id
      LEFT JOIN crbms cr ON o.crbm_id = cr.id
      WHERE n.grupo != 'Relatório de Óbitos'
      GROUP BY n.grupo, n.subgrupo
      ORDER BY n.grupo, n.subgrupo;
    `;
    const { rows } = await db.query(query, [data_inicio as string, data_fim as string]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.' });
  }
};

export const getEstatisticasAgrupadasPorData = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória.' });
    return;
  }

  try {
    const query = `
      WITH 
      dados_lote AS (
        SELECT 
          o.nome as cidade_nome,
          n.subgrupo as natureza_nome,
          n.abreviacao as natureza_abreviacao,
          cr.nome as crbm_nome,
          ed.quantidade
        FROM estatisticas_diarias ed
        JOIN obms o ON ed.obm_id = o.id
        JOIN naturezas_ocorrencia n ON ed.natureza_id = n.id
        JOIN crbms cr ON o.crbm_id = cr.id
        WHERE ed.data_registro = $1
          AND n.grupo != 'Relatório de Óbitos'
      ),
      dados_individuais AS (
        SELECT
          o.nome as cidade_nome,
          n.subgrupo as natureza_nome,
          n.abreviacao as natureza_abreviacao,
          cr.nome as crbm_nome,
          COUNT(occ.id) as quantidade
        FROM ocorrencias occ
        JOIN obms o ON occ.obm_id = o.id
        JOIN naturezas_ocorrencia n ON occ.natureza_id = n.id
        JOIN crbms cr ON o.crbm_id = cr.id
        WHERE occ.data_ocorrencia = $1
          AND n.grupo != 'Relatório de Óbitos'
        GROUP BY o.nome, n.subgrupo, n.abreviacao, cr.nome
      ),
      dados_unificados AS (
        SELECT * FROM dados_lote
        UNION ALL
        SELECT * FROM dados_individuais
      )
      SELECT
        cidade_nome,
        natureza_nome,
        natureza_abreviacao,
        crbm_nome,
        SUM(quantidade)::integer as quantidade
      FROM dados_unificados
      GROUP BY cidade_nome, natureza_nome, natureza_abreviacao, crbm_nome
      ORDER BY crbm_nome, cidade_nome, natureza_nome;
    `;
    
    const { rows } = await db.query(query, [data]);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Erro ao buscar estatísticas unificadas por data:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const limparEstatisticasDoDia = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { data, obm_id } = req.query;

  if (!data || typeof data !== 'string') {
    res.status(400).json({ message: 'A data é obrigatória para limpar os registros.' });
    return;
  }

  try {
    let result;
    if (obm_id && typeof obm_id === 'string') {
      result = await db.query(
        `DELETE FROM estatisticas_diarias WHERE data_registro = $1 AND obm_id = $2`, 
        [data, obm_id]
      );
      res.status(200).json({ message: `Operação concluída. ${result.rowCount} registros de estatística foram excluídos para a OBM no dia ${data}.` });
    } else {
      result = await db.query(
        `DELETE FROM estatisticas_diarias WHERE data_registro = $1`, 
        [data]
      );
      res.status(200).json({ message: `Operação concluída. ${result.rowCount} registros de estatística foram excluídos para o dia ${data}.` });
    }

  } catch (error) {
    console.error('Erro ao limpar estatísticas por data:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao limpar os registros.' });
  }
};
