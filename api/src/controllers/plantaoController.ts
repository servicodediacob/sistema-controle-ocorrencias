// Caminho: api/src/controllers/plantaoController.ts

import { Request, Response } from 'express';
import db from '@/db';
import logger from '@/config/logger';

export const getPlantao = async (_req: Request, res: Response): Promise<void> => {
  try {
    // --- INÍCIO DA CORREÇÃO ---
    // 1. A consulta agora busca TODAS as ocorrências detalhadas da data ATUAL.
    //    A ordenação é feita pelo horário, garantindo uma sequência lógica.
    const destaquesQuery = `
      SELECT 
        od.*,
        n.grupo as natureza_grupo,
        n.subgrupo as natureza_nome,
        c.nome as cidade_nome
      FROM ocorrencias_detalhadas od
      LEFT JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      LEFT JOIN obms c ON od.cidade_id = c.id
      WHERE od.data_ocorrencia = CURRENT_DATE
      ORDER BY od.horario_ocorrencia ASC, od.id ASC;
    `;
    // --- FIM DA CORREÇÃO ---
    
    const supervisorQuery = `
      SELECT 
        sp.usuario_id,
        u.nome as supervisor_nome
      FROM supervisor_plantao sp
      LEFT JOIN usuarios u ON sp.usuario_id = u.id
      WHERE sp.id = 1;
    `;

    const [destaquesResult, supervisorResult] = await Promise.all([
      db.query(destaquesQuery),
      db.query(supervisorQuery)
    ]);

    // 2. O nome da propriedade é alterado para refletir que agora é uma lista.
    res.status(200).json({
      ocorrenciasDestaque: destaquesResult.rows || [], // Renomeado de 'ocorrenciaDestaque' para 'ocorrenciasDestaque'
      supervisorPlantao: supervisorResult.rows[0] || null,
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar dados do plantão.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const getSupervisores = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query("SELECT id, nome FROM usuarios WHERE role = 'admin' ORDER BY nome ASC");
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar lista de supervisores.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const setSupervisorPlantao = async (req: Request, res: Response): Promise<void> => {
  const { usuario_id } = req.body;
  try {
    const query = 'UPDATE supervisor_plantao SET usuario_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
    const { rows } = await db.query(query, [usuario_id]);
    logger.info({ novoSupervisorId: usuario_id }, 'Supervisor de plantão atualizado.');
    res.status(200).json(rows[0]);
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao definir supervisor de plantão.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
