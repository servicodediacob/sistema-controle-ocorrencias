"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const dadosController_1 = require("../controllers/dadosController");
const router = (0, express_1.Router)();
// --- Rotas de OBMs ---
router.route('/obms')
    .get(dadosController_1.getObms)
    .post(authMiddleware_1.proteger, dadosController_1.criarObm);
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
