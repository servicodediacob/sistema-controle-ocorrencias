// backend/src/routes/dadosRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  getObms,
  criarObm,
  atualizarObm,
  excluirObm,
  getNaturezas,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia,
  deleteOcorrencia
} from '../controllers/dadosController';

const router = Router();

// --- Rotas de OBMs (CORRIGIDO) ---
// A rota '/obms' agora lida corretamente com GET (listar) e POST (criar).
router.route('/obms')
  .get(getObms)
  .post(proteger, criarObm); // CORREÇÃO: Aponta o método POST para o controlador 'criarObm'.

// Rotas para um ID específico de OBM (atualizar e excluir).
router.route('/obms/:id')
  .put(proteger, atualizarObm)
  .delete(proteger, excluirObm);

// --- Rotas de Naturezas de Ocorrência ---
router.route('/naturezas')
  .get(getNaturezas)
  .post(proteger, criarNatureza);

router.route('/naturezas/:id')
  .put(proteger, atualizarNatureza)
  .delete(proteger, excluirNatureza);

// --- Rotas de Ocorrências (CRUD) ---
router.route('/ocorrencias')
  .get(proteger, getOcorrencias)
  .post(proteger, criarOcorrencia);

router.route('/ocorrencias/:id')
  .put(proteger, updateOcorrencia)
  .delete(proteger, deleteOcorrencia);

export default router;
