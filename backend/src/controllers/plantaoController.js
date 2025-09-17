const db = require('../db');

/**
 * @desc    Buscar o estado atual do plantão (Ocorrência de Destaque e Supervisor)
 * @route   GET /api/plantao
 * @access  Privado
 */
const getPlantao = async (req, res) => {
  try {
    // Busca a ocorrência de destaque e faz um JOIN para pegar os detalhes
    const destaqueQuery = `
      SELECT 
        od.ocorrencia_id,
        o.data_ocorrencia,
        n.descricao as natureza_descricao,
        obm.nome as obm_nome
      FROM ocorrencia_destaque od
      LEFT JOIN ocorrencias o ON od.ocorrencia_id = o.id
      LEFT JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      LEFT JOIN obms obm ON o.obm_id = obm.id
      WHERE od.id = 1;
    `;
    const destaqueResult = await db.query(destaqueQuery);

    // Busca o supervisor de plantão
    const supervisorQuery = `
      SELECT 
        sp.usuario_id,
        u.nome as supervisor_nome
      FROM supervisor_plantao sp
      LEFT JOIN usuarios u ON sp.usuario_id = u.id
      WHERE sp.id = 1;
    `;
    const supervisorResult = await db.query(supervisorQuery);

    res.status(200).json({
      ocorrenciaDestaque: destaqueResult.rows[0] || null,
      supervisorPlantao: supervisorResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do plantão:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Definir/Atualizar a Ocorrência de Destaque
 * @route   POST /api/plantao/destaque
 * @access  Privado
 */
const setOcorrenciaDestaque = async (req, res) => {
  const { ocorrencia_id } = req.body; // Pode ser um ID ou null para limpar

  try {
    const query = `
      UPDATE ocorrencia_destaque 
      SET ocorrencia_id = $1, definido_em = CURRENT_TIMESTAMP 
      WHERE id = 1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [ocorrencia_id]);
    res.status(200).json({ message: 'Ocorrência de destaque atualizada!', data: rows[0] });
  } catch (error)
   {
    console.error('Erro ao definir ocorrência de destaque:', error);
    // Trata erro de chave estrangeira (ocorrência não existe)
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Ocorrência com o ID fornecido não foi encontrada.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Definir/Atualizar o Supervisor de Plantão
 * @route   POST /api/plantao/supervisor
 * @access  Privado
 */
const setSupervisorPlantao = async (req, res) => {
  const { usuario_id } = req.body; // Pode ser um ID ou null para limpar

  try {
    const query = `
      UPDATE supervisor_plantao 
      SET usuario_id = $1, definido_em = CURRENT_TIMESTAMP 
      WHERE id = 1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [usuario_id]);
    res.status(200).json({ message: 'Supervisor de plantão atualizado!', data: rows[0] });
  } catch (error) {
    console.error('Erro ao definir supervisor de plantão:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Buscar todos os usuários (supervisores) para o dropdown
 * @route   GET /api/plantao/supervisores
 * @access  Privado
 */
const getSupervisores = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, nome FROM usuarios ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar supervisores:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};


module.exports = {
  getPlantao,
  setOcorrenciaDestaque,
  setSupervisorPlantao,
  getSupervisores,
};
