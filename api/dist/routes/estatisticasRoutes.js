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
router.get('/estatisticas/agrupadas', authMiddleware_1.proteger, estatisticasController_1.getEstatisticasAgrupadasPorData);
router.delete('/estatisticas/limpar-dia', authMiddleware_1.proteger, (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), estatisticasController_1.limparTodosOsDadosDoDia);
// --- Nova rota para a integração ---
router.get('/estatisticas-externas/dashboard', authMiddleware_1.proteger, estatisticasController_1.getSisgpoDashboard);
exports.default = router;
