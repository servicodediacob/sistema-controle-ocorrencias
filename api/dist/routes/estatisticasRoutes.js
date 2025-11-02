"use strict";
// api/src/routes/estatisticasRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const estatisticasController_1 = require("../controllers/estatisticasController");
// CORREÇÃO FINAL: Importando as funções com os nomes corretos dos arquivos
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
// --- Rotas existentes ---
router.post('/estatisticas/lote', authMiddleware_1.proteger, estatisticasController_1.registrarEstatisticasLote);
router.get('/estatisticas/por-intervalo', authMiddleware_1.proteger, estatisticasController_1.getEstatisticasAgrupadasPorIntervalo);
router.delete('/limpeza/intervalo', authMiddleware_1.proteger, (0, roleMiddleware_1.roleMiddleware)(['admin']), estatisticasController_1.limparDadosPorIntervalo);
// --- Nova rota para a integração ---
router.get('/estatisticas-externas/dashboard', estatisticasController_1.getSisgpoDashboard);
exports.default = router;
