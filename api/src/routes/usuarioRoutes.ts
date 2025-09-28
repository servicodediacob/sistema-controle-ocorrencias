// Caminho: api/src/routes/usuarioRoutes.ts

import { Router } from 'express';
import { proteger } from '@/middleware/authMiddleware'; // Usando alias
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario
} from '@/controllers/usuarioController'; // Usando alias

const router = Router();

router.route('/')
  .get(proteger, listarUsuarios)
  .post(proteger, criarUsuario);

router.route('/:id')
  .put(proteger, atualizarUsuario)
  .delete(proteger, excluirUsuario);

export default router;
