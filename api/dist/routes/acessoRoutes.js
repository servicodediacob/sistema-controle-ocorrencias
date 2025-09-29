"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const acessoController_1 = require("../controllers/acessoController");
const router = (0, express_1.Router)();
// Rota pública para solicitar acesso
router.post('/solicitar', acessoController_1.solicitarAcesso);
// Rotas protegidas que exigem que o usuário seja um administrador
router.get('/', authMiddleware_1.proteger, roleMiddleware_1.isAdmin, acessoController_1.listarSolicitacoes);
router.put('/:id/gerenciar', authMiddleware_1.proteger, roleMiddleware_1.isAdmin, acessoController_1.gerenciarSolicitacao);
exports.default = router;
