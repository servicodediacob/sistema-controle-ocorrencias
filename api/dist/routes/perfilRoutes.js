"use strict";
// Caminho: api/src/routes/perfilRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const perfilController_1 = require("../controllers/perfilController");
const router = (0, express_1.Router)();
// Aplica o middleware de proteção a todas as rotas deste arquivo
router.use(authMiddleware_1.proteger);
// Rota para alterar a senha: PUT /api/perfil/alterar-senha
router.put('/alterar-senha', perfilController_1.alterarPropriaSenha);
exports.default = router;
