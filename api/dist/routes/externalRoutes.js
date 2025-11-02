"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const healthController_1 = require("../controllers/healthController");
const plantaoController_1 = require("../controllers/plantaoController");
const relatorioController_1 = require("../controllers/relatorioController");
const estatisticasController_1 = require("../controllers/estatisticasController");
const verifySsoJwt_1 = __importDefault(require("../middleware/verifySsoJwt"));
const router = (0, express_1.Router)();
// Health permanece público para monitoramento
router.get('/health', healthController_1.checkHealth);
// Rotas protegidas por SSO
router.get('/dashboard-ocorrencias', verifySsoJwt_1.default, dashboardController_1.getDashboardDataForSso);
router.get('/external/dashboard', verifySsoJwt_1.default, dashboardController_1.getDashboardDataForSso);
router.get('/external/dashboard/stats', verifySsoJwt_1.default, dashboardController_1.getDashboardStats);
router.get('/external/plantao', verifySsoJwt_1.default, plantaoController_1.getPlantao);
router.get('/external/relatorio-completo', verifySsoJwt_1.default, relatorioController_1.getRelatorioCompleto);
router.get('/external/estatisticas-por-intervalo', verifySsoJwt_1.default, (req, res) => {
    const data = req.query.data ? new Date(req.query.data) : new Date();
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    req.query.dataInicio = dataInicio.toISOString();
    req.query.dataFim = dataFim.toISOString();
    return (0, estatisticasController_1.getEstatisticasAgrupadasPorIntervalo)(req, res);
});
router.get('/external/espelho-base', verifySsoJwt_1.default, estatisticasController_1.getEspelhoBase);
exports.default = router;
