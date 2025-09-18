import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario
} from '../controllers/usuarioController';

const router = Router();

router.route('/')
  .get(proteger, listarUsuarios)
  .post(proteger, criarUsuario);

router.route('/:id')
  .put(proteger, atualizarUsuario)
  .delete(proteger, excluirUsuario);

export default router;
