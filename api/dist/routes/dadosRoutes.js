"use strict";
// backend/src/routes/dadosRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const dadosController_1 = require("../controllers/dadosController");
const router = (0, express_1.Router)();
// --- Rotas de OBMs (CORRIGIDO) ---
// A rota '/obms' agora lida corretamente com GET (listar) e POST (criar).
router.route('/obms')
    .get(dadosController_1.getObms)
    .post(authMiddleware_1.proteger, dadosController_1.criarObm); // CORREÇÃO: Aponta o método POST para o controlador 'criarObm'.
// Rotas para um ID específico de OBM (atualizar e excluir).
router.route('/obms/:id')
    .put(authMiddleware_1.proteger, dadosController_1.atualizarObm)
    .delete(authMiddleware_1.proteger, dadosController_1.excluirObm);
// --- Rotas de Naturezas de Ocorrência ---
router.route('/naturezas')
    .get(dadosController_1.getNaturezas)
    .post(authMiddleware_1.proteger, dadosController_1.criarNatureza);
router.route('/naturezas/:id')
    .put(authMiddleware_1.proteger, dadosController_1.atualizarNatureza)
    .delete(authMiddleware_1.proteger, dadosController_1.excluirNatureza);
// --- Rotas de Ocorrências (CRUD) ---
router.route('/ocorrencias')
    .get(authMiddleware_1.proteger, dadosController_1.getOcorrencias)
    .post(authMiddleware_1.proteger, dadosController_1.criarOcorrencia);
router.route('/ocorrencias/:id')
    .put(authMiddleware_1.proteger, dadosController_1.updateOcorrencia)
    .delete(authMiddleware_1.proteger, dadosController_1.deleteOcorrencia);
exports.default = router;
