// Caminho: api/src/controllers/plantaoController.ts

import { Request, Response } from 'express';
import db from '../db';

export const getPlantao = async (_req: Request, res: Response): Promise<void> => {
  try {
    // ======================= INÍCIO DA CORREÇÃO =======================
    // A query agora busca da tabela 'ocorrencias_detalhadas'
    const destaqueQuery = `
      SELECT 
        od.*,
        n.grupo as natureza_grupo,
        n.subgrupo as natureza_nome,
        c.nome as cidade_nome
      FROM ocorrencia_destaque d
      LEFT JOIN ocorrencias_detalhadas od ON d.ocorrencia_id = od.id
      LEFT JOIN naturezas_ocorrencia n ON od.natureza_id = n.id
      LEFT JOIN obms c ON od.cidade_id = c.id
      WHERE d.id = 1;
    `;
    // ======================= FIM DA CORREÇÃO =======================
    
    const supervisorQuery = `
      SELECT 
        sp.usuario_id,
        u.nome as supervisor_nome
      FROM supervisor_plantao sp
      LEFT JOIN usuarios u ON sp.usuario_id = u.id
      WHERE sp.id = 1;
    `;

    const [destaqueResult, supervisorResult] = await Promise.all([
      db.query(destaqueQuery),
      db.query(supervisorQuery)
    ]);

    res.status(200).json({
      // O objeto retornado agora contém todos os campos da ocorrência detalhada
      ocorrenciaDestaque: destaqueResult.rows[0] || null,
      supervisorPlantao: supervisorResult.rows[0] || null,
    });

  } catch (error) {
    console.error('Erro ao buscar dados do plantão:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// O resto do arquivo não precisa de alterações
export const getSupervisores = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT id, nome FROM usuarios ORDER BY nome ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar supervisores:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const setOcorrenciaDestaque = async (req: Request, res: Response): Promise<void> => {
  const { ocorrencia_id } = req.body;
  try {
    const query = 'UPDATE ocorrencia_destaque SET ocorrencia_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
    const { rows } = await db.query(query, [ocorrencia_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao definir ocorrência de destaque:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const setSupervisorPlantao = async (req: Request, res: Response): Promise<void> => {
  const { usuario_id } = req.body;
  try {
    const query = 'UPDATE supervisor_plantao SET usuario_id = $1, definido_em = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *';
    const { rows } = await db.query(query, [usuario_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao definir supervisor de plantão:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
