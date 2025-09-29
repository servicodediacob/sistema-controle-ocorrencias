"use strict";
// Caminho: api/src/routes/diagRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diagController_1 = require("../controllers/diagController");
const router = (0, express_1.Router)();
// Esta rota responderá em GET /api/diag
router.get('/', diagController_1.runDiagnostics);
exports.default = router;
