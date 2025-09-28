// Caminho: api/src/controllers/estatisticasController.ts
// VERSÃO COM ASSINATURA DE TIPO CORRIGIDA

import { Response } from 'express';
import { RequestWithUser } from '../middleware/authMiddleware';
import db from '../db';

interface DashboardStats {
  totalOcorrencias: number;
  totalObitos: number;
  ocorrenciasPorNatureza: { nome: string; total: number }[];
  ocorrenciasPorCrbm: { nome: string; total: number }[];
}

interface EstatisticaPayload {
  data_registro: string;
  obm_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

export const getDashboardStats = async (_req: RequestWithUser, res: Response): Promise<Response | void> => {
  try {
    const query = `
      WITH 
      ocorrencias_unificadas AS (
        SELECT natureza_id, quantidade, obm_id FROM estatisticas_diarias
        UNION ALL
        SELECT natureza_id, 1 AS quantidade, cidade_id AS obm_id FROM ocorrencias_detalhadas
      ),
      ocorrencias_sem_obitos AS (
        SELECT * FROM ocorrencias_unificadas
        WHERE natureza_id NOT IN (SELECT id FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos')
      ),
      total_ocorrencias_unificadas AS (
        SELECT COALESCE(SUM(quantidade), 0) AS total FROM ocorrencias_sem_obitos
      ),
      ocorrencias_por_natureza AS (
        SELECT
          n.subgrupo AS nome,
          SUM(osu.quantidade)::int AS total
        FROM ocorrencias_sem_obitos osu
        JOIN naturezas_ocorrencia n ON osu.natureza_id = n.id
        GROUP BY n.subgrupo
        ORDER BY total DESC
      ),
      ocorrencias_por_crbm AS (
        SELECT
          cr.nome,
          SUM(osu.quantidade)::int AS total
        FROM ocorrencias_sem_obitos osu
        JOIN obms ob ON osu.obm_id = ob.id
        JOIN crbms cr ON ob.crbm_id = cr.id
        GROUP BY cr.nome
        ORDER BY total DESC
      ),
      total_obitos_registros AS (
        SELECT COALESCE(SUM(quantidade_vitimas), 0) AS total FROM obitos_registros
      )
      SELECT json_build_object(
        'totalOcorrencias', (SELECT total FROM total_ocorrencias_unificadas),
        'totalObitos', (SELECT total FROM total_obitos_registros),
        'ocorrenciasPorNatureza', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_natureza) t), '[]'::json),
        'ocorrenciasPorCrbm', COALESCE((SELECT json_agg(t) FROM (SELECT * FROM ocorrencias_por_crbm) t), '[]'::json)
      ) AS stats;
    `;

    const { rows } = await db.query(query);
    const stats: DashboardStats = rows[0].stats;
    
    return res.status(200).json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas.' });
  }
};

export const registrarEstatisticasLote = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data_registro, obm_id, estatisticas } = req.body as EstatisticaPayload;
  const usuario = req.usuario; 

  if (!usuario) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  if (usuario.role !== 'admin' && usuario.obm_id !== obm_id) {
    return res.status(403).json({ message: 'Acesso negado. Você só pode registrar dados para a sua própria OBM.' });
  }

  if (!data_registro || !obm_id || !estatisticas) {
    return res.status(400).json({ message: 'Dados incompletos. data_registro, obm_id e estatisticas são obrigatórios.' });
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
      
      const values = [data_registro, obm_id, stat.natureza_id, quantidade, usuario.id];
      await client.query(query, values);
      totalRegistrosCriados++;
    }

    if (totalRegistrosCriados === 0) {
        await client.query('ROLLBACK');
        return res.status(200).json({ message: 'Nenhuma estatística para registrar (quantidades zeradas). Registros anteriores para o dia e OBM foram limpos.' });
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: `${totalRegistrosCriados} tipo(s) de estatística registrados com sucesso para a OBM!` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar estatísticas em lote (transação revertida):', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao registrar as estatísticas.' });
  } finally {
    client.release();
  }
};

export const getEstatisticasAgrupadasPorData = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ message: 'A data é obrigatória.' });
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
        FROM ocorrencias_detalhadas occ
        JOIN obms o ON occ.cidade_id = o.id
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
    return res.status(200).json(rows);

  } catch (error) {
    console.error('Erro ao buscar estatísticas unificadas por data:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const limparTodosOsDadosDoDia = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data } = req.query;
  const usuario = req.usuario;

  if (!usuario || usuario.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
  }

  if (!data || typeof data !== 'string') {
    return res.status(400).json({ message: 'A data é obrigatória para limpar os registros.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const loteResult = await client.query(
      `DELETE FROM estatisticas_diarias WHERE data_registro = $1`, 
      [data]
    );

    const detalhadasResult = await client.query(
      `DELETE FROM ocorrencias_detalhadas WHERE data_ocorrencia = $1`, 
      [data]
    );
    
    await client.query(
      `UPDATE ocorrencia_destaque SET ocorrencia_id = NULL 
       WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM ocorrencias_detalhadas WHERE id = ocorrencia_destaque.ocorrencia_id)`,
      []
    );

    await client.query('COMMIT');

    const totalLimpado = (loteResult.rowCount ?? 0) + (detalhadasResult.rowCount ?? 0);
    
    return res.status(200).json({ message: `Operação concluída. ${totalLimpado} registros de ocorrência foram excluídos para o dia ${data}.` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao limpar todos os dados do dia:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao limpar os registros.' });
  } finally {
    client.release();
  }
};
