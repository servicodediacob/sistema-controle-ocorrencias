// Caminho: api/src/routes/dadosRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';

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

import { 
  registrarEstatisticasLote,
  getEstatisticasAgrupadasPorData,
  limparTodosOsDadosDoDia
} from '../controllers/estatisticasController';

import { 
  getObitosPorData, 
  criarObitoRegistro,
  atualizarObitoRegistro,
  deletarObitoRegistro,
  limparRegistrosPorData
} from '../controllers/obitosRegistrosController';

import { getRelatorioCompleto } from '../controllers/relatorioController';

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

// --- Rotas de Ocorrências (CRUD principal - legado) ---
router.route('/ocorrencias')
  .get(proteger, getOcorrencias)
  .post(proteger, criarOcorrencia);

router.route('/ocorrencias/:id')
  .put(proteger, updateOcorrencia)
  .delete(proteger, deleteOcorrencia);

// --- Rota para o formulário de lançamento em lote ---
router.route('/estatisticas/lote')
  .post(proteger, registrarEstatisticasLote);

// --- Rota para o relatório consolidado ---
router.route('/relatorio-completo')
  .get(proteger, getRelatorioCompleto);

// --- Rota para buscar os dados da tabela de lançamentos ---
router.route('/estatisticas/por-data')
  .get(proteger, getEstatisticasAgrupadasPorData);

// --- Rota de limpeza completa ---
router.route('/limpeza/dia-completo')
  .delete(proteger, limparTodosOsDadosDoDia);

// --- Rotas para o CRUD de Registros de Óbitos ---
router.route('/obitos-registros')
  .get(proteger, getObitosPorData)
  .post(proteger, criarObitoRegistro)
  .delete(proteger, limparRegistrosPorData);

router.route('/obitos-registros/:id')
  .put(proteger, atualizarObitoRegistro)
  .delete(proteger, deletarObitoRegistro);

// Garante que o router seja exportado como padrão.
export default router;
