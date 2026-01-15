// Caminho: api/src/routes/unidadesRoutes.ts

import { Router } from 'express';
import { proteger } from '@/middleware/authMiddleware'; // Usando alias
import {
  getUnidades,
  criarUnidade,
  atualizarUnidade,
  excluirUnidade,
  getCrbms
} from '@/controllers/unidadesController'; // Usando alias

const router = Router();

// Rotas para /api/unidades
router.route('/')
  .get(getUnidades) // Rota pública para listagem
  .post(proteger, criarUnidade); // Rota protegida para criação

router.route('/:id')
  .put(proteger, atualizarUnidade)
  .delete(proteger, excluirUnidade);

// Rota para /api/unidades/crbms (aninhada para organização)
router.route('/crbms')
  .get(proteger, getCrbms);

export default router;
