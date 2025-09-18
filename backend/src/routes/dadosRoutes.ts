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

// --- Rotas de OBMs (Organizações Bombeiro Militar) ---
// A rota '/obms' lida com a coleção de OBMs.
// GET para listar todas, POST para criar uma nova.
router.route('/obms')
  .get(getObms)
  .post(proteger, criarObm); // CORREÇÃO: 'criarObm' agora está na rota correta.

// A rota '/obms/:id' lida com um recurso específico.
// PUT para atualizar, DELETE para excluir.
router.route('/obms/:id')
  .put(proteger, atualizarObm)
  .delete(proteger, excluirObm);

// --- Rotas de Naturezas de Ocorrência ---
// A mesma lógica RESTful se aplica aqui.
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
