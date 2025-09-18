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

// Rota para a coleção de unidades
// GET para listar todas, POST para criar uma nova.
router.route('/unidades')
  .get(proteger, getUnidades)
  .post(proteger, criarUnidade);

// Rota para um recurso específico de unidade (identificado pelo ID da cidade)
// PUT para atualizar, DELETE para excluir.
router.route('/unidades/:id')
  .put(proteger, atualizarUnidade)
  .delete(proteger, excluirUnidade);

// Rota para buscar apenas os CRBMs (para preencher dropdowns)
router.route('/crbms')
  .get(proteger, getCrbms);

export default router;
