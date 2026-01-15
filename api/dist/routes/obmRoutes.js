"use strict";
// api/src/routes/obmRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const obmController_1 = require("../controllers/obmController");
const router = (0, express_1.Router)();
router.get('/pendentes-por-intervalo', authMiddleware_1.proteger, (req, res) => (0, obmController_1.getObmsPendentesPorIntervalo)(req, res));
exports.default = router;
