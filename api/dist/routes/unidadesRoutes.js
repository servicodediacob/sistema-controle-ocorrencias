"use strict";
// Caminho: api/src/routes/unidadesRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Usando alias
const unidadesController_1 = require("../controllers/unidadesController"); // Usando alias
const router = (0, express_1.Router)();
// Rotas para /api/unidades
router.route('/')
    .get(unidadesController_1.getUnidades) // Rota pública para listagem
    .post(authMiddleware_1.proteger, unidadesController_1.criarUnidade); // Rota protegida para criação
router.route('/:id')
    .put(authMiddleware_1.proteger, unidadesController_1.atualizarUnidade)
    .delete(authMiddleware_1.proteger, unidadesController_1.excluirUnidade);
// Rota para /api/unidades/crbms (aninhada para organização)
router.route('/crbms')
    .get(authMiddleware_1.proteger, unidadesController_1.getCrbms);
exports.default = router;
