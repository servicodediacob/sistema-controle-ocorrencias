"use strict";
// Caminho: api/src/routes/dashboardRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController"); // Usando alias
const authMiddleware_1 = require("../middleware/authMiddleware"); // Usando alias
const router = (0, express_1.Router)();
// A rota GET /stats será acessível através de /api/dashboard/stats
router.get('/stats', authMiddleware_1.proteger, dashboardController_1.getDashboardStats);
exports.default = router;
