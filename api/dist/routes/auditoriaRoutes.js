"use strict";
// Caminho: api/src/routes/auditoriaRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const auditoriaController_1 = require("../controllers/auditoriaController");
const router = (0, express_1.Router)();
// The navigation logging should be protected, but not restricted to admins
router.post('/navigation', authMiddleware_1.proteger, auditoriaController_1.registrarNavegacao);
router.post('/relatorio', authMiddleware_1.proteger, auditoriaController_1.registrarGeracaoRelatorio);
router.post('/chat/abertura', authMiddleware_1.proteger, auditoriaController_1.registrarAberturaChat);
router.post('/chat/fechamento', authMiddleware_1.proteger, auditoriaController_1.registrarFechamentoChat);
router.post('/chat/mensagem', authMiddleware_1.proteger, auditoriaController_1.registrarMensagemChat);
// Protege as rotas de listagem de logs e exige que o usuário seja admin
router.get('/', authMiddleware_1.proteger, roleMiddleware_1.isAdmin, auditoriaController_1.listarLogs);
exports.default = router;
