"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
// Importa TODOS os controllers necessários
const dadosController_1 = require("../controllers/dadosController");
const unidadesController_1 = require("../controllers/unidadesController");
const usuarioController_1 = require("../controllers/usuarioController");
const estatisticasController_1 = require("../controllers/estatisticasController");
const obitosRegistrosController_1 = require("../controllers/obitosRegistrosController");
const relatorioController_1 = require("../controllers/relatorioController");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
// --- Rotas de Naturezas (Públicas) ---
router.get('/naturezas', dadosController_1.getNaturezas);
router.post('/naturezas/por-nomes', dadosController_1.getNaturezasPorNomes);
// Aplica proteção a todas as rotas deste arquivo
router.use(authMiddleware_1.proteger);
// --- Rotas de Naturezas (Protegidas) ---
router.post('/naturezas', roleMiddleware_1.isAdmin, dadosController_1.criarNatureza);
router.route('/naturezas/:id').put(roleMiddleware_1.isAdmin, dadosController_1.atualizarNatureza).delete(roleMiddleware_1.isAdmin, dadosController_1.excluirNatureza);
// --- Rotas de Unidades (OBMs) e CRBMs ---
router.route('/unidades').get(unidadesController_1.getUnidades).post(roleMiddleware_1.isAdmin, unidadesController_1.criarUnidade);
router.route('/unidades/:id').put(roleMiddleware_1.isAdmin, unidadesController_1.atualizarUnidade).delete(roleMiddleware_1.isAdmin, unidadesController_1.excluirUnidade);
router.get('/crbms', unidadesController_1.getCrbms);
// --- Rotas de Usuários ---
router.route('/usuarios').get(roleMiddleware_1.isAdmin, usuarioController_1.listarUsuarios).post(roleMiddleware_1.isAdmin, usuarioController_1.criarUsuario);
router.route('/usuarios/:id').put(roleMiddleware_1.isAdmin, usuarioController_1.atualizarUsuario).delete(roleMiddleware_1.isAdmin, usuarioController_1.excluirUsuario);
// --- Rotas de Estatísticas ---
router.post('/estatisticas/lote', estatisticasController_1.registrarEstatisticasLote);
router.get('/estatisticas/por-intervalo', estatisticasController_1.getEstatisticasAgrupadasPorIntervalo);
// --- Rotas de Óbitos ---
router.route('/obitos-registros').get(obitosRegistrosController_1.getObitosPorData).post(obitosRegistrosController_1.criarObitoRegistro).delete(roleMiddleware_1.isAdmin, obitosRegistrosController_1.limparRegistrosPorData);
router.route('/obitos-registros/:id').put(obitosRegistrosController_1.atualizarObitoRegistro).delete(obitosRegistrosController_1.deletarObitoRegistro);
// --- Rotas de Relatórios e Dashboard ---
router.get('/relatorio-completo', relatorioController_1.getRelatorioCompleto);
router.get('/dashboard/stats', dashboardController_1.getDashboardStats); // <-- ROTA ADICIONADA
// --- Rota de Limpeza ---
router.delete('/limpeza/intervalo', roleMiddleware_1.isAdmin, estatisticasController_1.limparDadosPorIntervalo);
exports.default = router;
