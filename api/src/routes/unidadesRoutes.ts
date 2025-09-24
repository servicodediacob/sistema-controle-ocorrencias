// api/src/routes/unidadesRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  getUnidades,
  criarUnidade,
  atualizarUnidade,
  excluirUnidade,
  getCrbms
} from '../controllers/unidadesController';

const router = Router();

// ======================= INÍCIO DA CORREÇÃO =======================
// A rota GET /unidades agora é PÚBLICA. As outras (POST, PUT, DELETE) continuam protegidas.
router.route('/unidades')
  .get(getUnidades) // Rota pública para listagem
  .post(proteger, criarUnidade); // Rota protegida para criação
// ======================= FIM DA CORREÇÃO =======================

router.route('/unidades/:id')
  .put(proteger, atualizarUnidade)
  .delete(proteger, excluirUnidade);

router.route('/crbms')
  .get(proteger, getCrbms);

export default router;
