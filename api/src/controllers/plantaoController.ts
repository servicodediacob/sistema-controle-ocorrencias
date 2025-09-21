// api/src/controllers/plantaoController.ts
import { Request, Response } from 'express';
import db from '../db';

export const getPlantao = async (_req: Request, res: Response): Promise<void> => {
  try {
    // CORREÇÃO: Troca 'cidades' por 'obms' e 'cidade_id' por 'obm_id'
    const destaqueQuery = `
      SELECT 
        od.ocorrencia_id,
        o.data_ocorrencia,
        CONCAT(n.grupo, ' - ', n.subgrupo) as natureza_descricao,
        ob.nome as cidade_nome,
        cr.nome as crbm_nome
      FROM ocorrencia_destaque od
      LEFT JOIN ocorrencias o ON od.ocorrencia_id = o.id
      LEFT JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      LEFT JOIN obms ob ON o.obm_id = ob.id
      LEFT JOIN crbms cr ON ob.crbm_id = cr.id
      WHERE od.id = 1;
    `;
    
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
