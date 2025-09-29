import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';

// Importa TODOS os controllers necessários
import {
  getNaturezas,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  getNaturezasPorNomes // <-- ROTA FALTANTE ADICIONADA
} from '../controllers/dadosController';

import { 
  getUnidades, criarUnidade, atualizarUnidade, excluirUnidade, getCrbms
} from '../controllers/unidadesController';

import {
  listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario
} from '../controllers/usuarioController';

import {
  registrarEstatisticasLote,
  getEstatisticasAgrupadasPorData,
  limparTodosOsDadosDoDia
} from '../controllers/estatisticasController';

import { 
  getObitosPorData, criarObitoRegistro, atualizarObitoRegistro,
  deletarObitoRegistro, limparRegistrosPorData
} from '../controllers/obitosRegistrosController';

import { getRelatorioCompleto } from '../controllers/relatorioController';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

// Aplica proteção a todas as rotas deste arquivo
router.use(proteger);

// --- Rotas de Naturezas ---
router.route('/naturezas').get(getNaturezas).post(isAdmin, criarNatureza);
router.route('/naturezas/:id').put(isAdmin, atualizarNatureza).delete(isAdmin, excluirNatureza);
router.post('/naturezas/por-nomes', getNaturezasPorNomes); // <-- ROTA ADICIONADA

// --- Rotas de Unidades (OBMs) e CRBMs ---
router.route('/unidades').get(getUnidades).post(isAdmin, criarUnidade);
router.route('/unidades/:id').put(isAdmin, atualizarUnidade).delete(isAdmin, excluirUnidade);
router.get('/crbms', getCrbms);

// --- Rotas de Usuários ---
router.route('/usuarios').get(isAdmin, listarUsuarios).post(isAdmin, criarUsuario);
router.route('/usuarios/:id').put(isAdmin, atualizarUsuario).delete(isAdmin, excluirUsuario);

// --- Rotas de Estatísticas ---
router.post('/estatisticas/lote', registrarEstatisticasLote);
router.get('/estatisticas/por-data', getEstatisticasAgrupadasPorData);

// --- Rotas de Óbitos ---
router.route('/obitos-registros').get(getObitosPorData).post(criarObitoRegistro).delete(isAdmin, limparRegistrosPorData);
router.route('/obitos-registros/:id').put(atualizarObitoRegistro).delete(deletarObitoRegistro);

// --- Rotas de Relatórios e Dashboard ---
router.get('/relatorio-completo', getRelatorioCompleto);
router.get('/dashboard/stats', getDashboardStats); // <-- ROTA ADICIONADA

// --- Rota de Limpeza ---
router.delete('/limpeza/dia-completo', isAdmin, limparTodosOsDadosDoDia);

export default router;
