"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("@/controllers/dashboardController");
const healthController_1 = require("@/controllers/healthController");
const router = (0, express_1.Router)();
// Rotas públicas para consumo externo (sem autenticação)
router.get('/dashboard-ocorrencias', dashboardController_1.getDashboardDataForSso);
router.get('/health', healthController_1.checkHealth);
exports.default = router;
