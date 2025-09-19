import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';

// Controller de dados gerais (Naturezas, Ocorrências)
import {
  getNaturezas,
  getNaturezasPorNomes,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia,
  deleteOcorrencia
} from '../controllers/dadosController';

// Controller do formulário de lançamento em lote e relatório estatístico
import { registrarEstatisticas, getRelatorioEstatisticas } from '../controllers/estatisticasController';

// Controller para o novo CRUD de registros de óbitos
import { 
  getObitosPorData, 
  criarObitoRegistro,
  atualizarObitoRegistro,
  deletarObitoRegistro
} from '../controllers/obitosRegistrosController';

const router = Router();

// --- Rotas de Naturezas de Ocorrência ---
router.route('/naturezas')
  .get(getNaturezas)
  .post(proteger, criarNatureza);

// Rota para buscar naturezas por uma lista de nomes
router.route('/naturezas/por-nomes')
  .post(proteger, getNaturezasPorNomes);

router.route('/naturezas/:id')
  .put(proteger, atualizarNatureza)
  .delete(proteger, excluirNatureza);

// --- Rotas de Ocorrências (CRUD principal) ---
router.route('/ocorrencias')
  .get(proteger, getOcorrencias)
  .post(proteger, criarOcorrencia);

router.route('/ocorrencias/:id')
  .put(proteger, updateOcorrencia)
  .delete(proteger, deleteOcorrencia);

// --- Rota para o formulário de lançamento em lote ---
router.route('/estatisticas/lote')
  .post(proteger, registrarEstatisticas);

// --- Rota para buscar os dados do relatório estatístico consolidado ---
router.route('/relatorio')
  .get(proteger, getRelatorioEstatisticas);

// --- Rotas para o CRUD de Registros de Óbitos ---
router.route('/obitos-registros')
  .get(proteger, getObitosPorData)
  .post(proteger, criarObitoRegistro);

router.route('/obitos-registros/:id')
  .put(proteger, atualizarObitoRegistro)
  .delete(proteger, deletarObitoRegistro);


export default router;
