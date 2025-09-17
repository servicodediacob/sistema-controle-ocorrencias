// backend/src/controllers/usuarioController.js

const db = require('../db');
const bcrypt = require('bcryptjs');

/**
 * @desc    Listar todos os usuários
 * @route   GET /api/usuarios
 * @access  Privado
 */
const listarUsuarios = async (req, res) => {
  try {
    // Seleciona todos os usuários, excluindo o campo da senha por segurança
    const { rows } = await db.query('SELECT id, nome, email, criado_em FROM usuarios ORDER BY nome ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Criar um novo usuário
 * @route   POST /api/usuarios
 * @access  Privado
 */
const criarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    // Verifica se o email já existe
    const userExists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'Este email já está em uso.' });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // Insere o novo usuário no banco
    const query = 'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em';
    const { rows } = await db.query(query, [nome, email, senha_hash]);

    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Atualizar um usuário
 * @route   PUT /api/usuarios/:id
 * @access  Privado
 */
const atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  try {
    const query = 'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, criado_em';
    const { rows } = await db.query(query, [nome, email, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso!', usuario: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Excluir um usuário
 * @route   DELETE /api/usuarios/:id
 * @access  Privado
 */
const excluirUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // Antes de excluir, verifica se o usuário não é o supervisor de plantão
    const plantaoCheck = await db.query('SELECT usuario_id FROM supervisor_plantao WHERE usuario_id = $1', [id]);
    if (plantaoCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir o usuário que está definido como supervisor de plantão. Remova-o do plantão primeiro.' });
    }

    const result = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    // Trata erro de chave estrangeira, caso o usuário esteja ligado a algo não previsto
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir este usuário, pois ele está associado a outros registros no sistema.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


module.exports = {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario,
};
