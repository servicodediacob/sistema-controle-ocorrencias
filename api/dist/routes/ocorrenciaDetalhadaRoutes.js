"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ocorrenciaDetalhadaController_1 = require("../controllers/ocorrenciaDetalhadaController");
const router = (0, express_1.Router)();
// Todas as rotas aqui são protegidas, exigindo um token válido
router.use(authMiddleware_1.proteger);
router.route('/')
    .post(ocorrenciaDetalhadaController_1.criarOcorrenciaDetalhada);
router.get('/por-intervalo', ocorrenciaDetalhadaController_1.getOcorrenciasDetalhadasPorIntervalo);
router.route('/:id')
    .put(ocorrenciaDetalhadaController_1.atualizarOcorrenciaDetalhada)
    .delete(ocorrenciaDetalhadaController_1.deletarOcorrenciaDetalhada);
exports.default = router;
