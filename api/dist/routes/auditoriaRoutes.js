"use strict";
// Caminho: api/src/routes/auditoriaRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const auditoriaController_1 = require("../controllers/auditoriaController");
const router = (0, express_1.Router)();
// Protege todas as rotas de auditoria e exige que o usuário seja admin
router.use(authMiddleware_1.proteger, roleMiddleware_1.isAdmin);
router.get('/', auditoriaController_1.listarLogs);
exports.default = router;
