import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  // Funções do controller de dados original
  getNaturezas,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia,
  deleteOcorrencia
} from '../controllers/dadosController';

// Importa as novas funções do controller de estatísticas
import { registrarEstatisticas, getRelatorioEstatisticas } from '../controllers/estatisticasController';

const router = Router();

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

// --- Novas Rotas para Estatísticas e Relatórios ---

// Rota para o formulário de lançamento em lote
router.route('/estatisticas/lote')
  .post(proteger, registrarEstatisticas);

// Rota para buscar os dados do relatório
router.route('/relatorio')
  .get(proteger, getRelatorioEstatisticas);


export default router;
