"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const usuarioController_1 = require("../controllers/usuarioController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authMiddleware_1.proteger, usuarioController_1.listarUsuarios)
    .post(authMiddleware_1.proteger, usuarioController_1.criarUsuario);
router.route('/:id')
    .put(authMiddleware_1.proteger, usuarioController_1.atualizarUsuario)
    .delete(authMiddleware_1.proteger, usuarioController_1.excluirUsuario);
exports.default = router;
