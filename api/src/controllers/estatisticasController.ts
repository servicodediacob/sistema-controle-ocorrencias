import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import logger from '@/config/logger';

interface EstatisticaPayload {
  data_registro: string;
  obm_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

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

    await client.query('COMMIT');

    if (totalRegistrosCriados === 0) {
        logger.info({ data: data_registro, obm_id }, 'Registros de estatísticas limpos (nenhum dado novo para inserir).');
        return res.status(200).json({ message: 'Nenhuma estatística para registrar (quantidades zeradas). Registros anteriores para o dia e OBM foram limpos.' });
    }
    
    logger.info({ data: data_registro, obm_id, count: totalRegistrosCriados }, 'Estatísticas em lote registradas com sucesso.');
    return res.status(201).json({ message: `${totalRegistrosCriados} tipo(s) de estatística registrados com sucesso para a OBM!` });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error, body: req.body }, 'Erro ao registrar estatísticas em lote.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
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
      WITH dados_unificados AS (
        SELECT ed.natureza_id, ed.quantidade, o.nome AS cidade_nome, cr.nome AS crbm_nome
        FROM estatisticas_diarias ed
        JOIN obms o ON ed.obm_id = o.id
        JOIN crbms cr ON o.crbm_id = cr.id
        WHERE ed.data_registro = $1
        
        UNION ALL
        
        SELECT od.natureza_id, 1 AS quantidade, o.nome AS cidade_nome, cr.nome AS crbm_nome
        FROM ocorrencias_detalhadas od
        JOIN obms o ON od.cidade_id = o.id
        JOIN crbms cr ON o.crbm_id = cr.id
        WHERE od.data_ocorrencia = $1
      )
      SELECT
        du.cidade_nome,
        n.subgrupo as natureza_nome,
        n.abreviacao as natureza_abreviacao,
        du.crbm_nome,
        SUM(du.quantidade)::integer as quantidade
      FROM dados_unificados du
      JOIN naturezas_ocorrencia n ON du.natureza_id = n.id
      WHERE n.grupo != 'Relatório de Óbitos'
      GROUP BY du.cidade_nome, n.subgrupo, n.abreviacao, du.crbm_nome
      ORDER BY du.crbm_nome, du.cidade_nome, n.subgrupo;
    `;
    
    const { rows } = await db.query(query, [data]);
    return res.status(200).json(rows);

  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao buscar estatísticas unificadas por data.');
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

    const loteResult = await client.query(`DELETE FROM estatisticas_diarias WHERE data_registro = $1`, [data]);
    const detalhadasResult = await client.query(`DELETE FROM ocorrencias_detalhadas WHERE data_ocorrencia = $1`, [data]);
    
    await client.query(`UPDATE ocorrencia_destaque SET ocorrencia_id = NULL WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM ocorrencias_detalhadas WHERE id = ocorrencia_destaque.ocorrencia_id)`);

    await client.query('COMMIT');

    const totalLimpado = (loteResult.rowCount ?? 0) + (detalhadasResult.rowCount ?? 0);
    logger.info({ data, adminId: usuario.id, total: totalLimpado }, 'Limpeza de dados do dia executada.');
    
    return res.status(200).json({ message: `Operação concluída. ${totalLimpado} registros de ocorrência foram excluídos para o dia ${data}.` });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error, query: req.query }, 'Erro ao limpar todos os dados do dia.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};
