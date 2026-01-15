"use strict";
// Caminho: api/src/routes/diagRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diagController_1 = require("../controllers/diagController");
const verifySsoJwt_1 = __importDefault(require("../middleware/verifySsoJwt"));
const router = (0, express_1.Router)();
// Esta rota responderá em GET /api/diag
router.get('/', diagController_1.runDiagnostics);
router.get('/sso-check', verifySsoJwt_1.default, (req, res) => {
    res.json({ status: 'ok', message: 'SSO token válido.' });
});
exports.default = router;
