// backend/src/routes/usuarioRoutes.js

const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/authMiddleware');
const {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario
} = require('../controllers/usuarioController');

// Todas as rotas abaixo são protegidas e exigem um token de autenticação válido.

// Rota para listar todos os usuários e criar um novo usuário
router.route('/')
  .get(proteger, listarUsuarios)
  .post(proteger, criarUsuario);

// Rota para atualizar e excluir um usuário específico pelo ID
router.route('/:id')
  .put(proteger, atualizarUsuario)
  .delete(proteger, excluirUsuario);

module.exports = router;
