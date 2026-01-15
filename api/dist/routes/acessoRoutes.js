"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const acessoController_1 = require("../controllers/acessoController");
const unidadesController_1 = require("../controllers/unidadesController");
const router = (0, express_1.Router)();
// Rota pública para solicitar acesso
router.post('/solicitar', acessoController_1.solicitarAcesso);
router.post('/solicitar-google', acessoController_1.solicitarAcessoGoogle);
// Lista de OBMs acessível antes do login (para o formulário público)
router.get('/obms-public', unidadesController_1.getUnidades);
// Rotas protegidas que exigem que o usuário seja um administrador
router.get('/', authMiddleware_1.proteger, roleMiddleware_1.isAdmin, acessoController_1.listarSolicitacoes);
router.put('/:id/gerenciar', authMiddleware_1.proteger, roleMiddleware_1.isAdmin, acessoController_1.gerenciarSolicitacao);
exports.default = router;
