"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const plantaoController_1 = require("../controllers/plantaoController");
const router = (0, express_1.Router)();
// Todas as rotas de plantão são protegidas
router.use(authMiddleware_1.proteger);
router.get('/', plantaoController_1.getPlantao);
router.get('/supervisores', plantaoController_1.getSupervisores);
// Apenas administradores podem definir o supervisor
router.post('/supervisor', roleMiddleware_1.isAdmin, plantaoController_1.setSupervisorPlantao);
exports.default = router;
