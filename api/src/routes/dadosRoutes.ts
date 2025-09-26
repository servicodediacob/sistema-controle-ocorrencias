// Caminho: api/src/routes/dadosRoutes.ts

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
import { 
  registrarEstatisticasLote,
  getRelatorioEstatisticas,
  getEstatisticasAgrupadasPorData,
  limparEstatisticasDoDia
} from '../controllers/estatisticasController';

// Controller para o novo CRUD de registros de óbitos
import { 
  getObitosPorData, 
  criarObitoRegistro,
  atualizarObitoRegistro,
  deletarObitoRegistro,
  limparRegistrosPorData
} from '../controllers/obitosRegistrosController';

// ======================= INÍCIO DA ALTERAÇÃO =======================
// 1. Importe o novo controller que criamos no passo anterior
import { getRelatorioCompleto } from '../controllers/relatorioController';
// ======================= FIM DA ALTERAÇÃO =======================

const router = Router();

// --- Rotas de Naturezas de Ocorrência ---
router.route('/naturezas')
  .get(getNaturezas)
  .post(proteger, criarNatureza);

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
  .post(proteger, registrarEstatisticasLote);

// --- Rota para buscar os dados do relatório estatístico consolidado (ANTIGA) ---
router.route('/relatorio')
  .get(proteger, getRelatorioEstatisticas);

// ======================= INÍCIO DA ALTERAÇÃO =======================
// 2. Adicione a nova rota para o relatório completo
router.route('/relatorio-completo')
  .get(proteger, getRelatorioCompleto);
// ======================= FIM DA ALTERAÇÃO =======================

// --- Rota para buscar e limpar os dados da tabela de lançamentos ---
router.route('/estatisticas/por-data')
  .get(proteger, getEstatisticasAgrupadasPorData)
  .delete(proteger, limparEstatisticasDoDia);

// --- Rotas para o CRUD de Registros de Óbitos ---
router.route('/obitos-registros')
  .get(proteger, getObitosPorData)
  .post(proteger, criarObitoRegistro)
  .delete(proteger, limparRegistrosPorData);

router.route('/obitos-registros/:id')
  .put(proteger, atualizarObitoRegistro)
  .delete(proteger, deletarObitoRegistro);

export default router;
