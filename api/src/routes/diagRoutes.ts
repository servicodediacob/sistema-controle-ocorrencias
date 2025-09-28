// Caminho: api/src/routes/diagRoutes.ts

import { Router } from 'express';
import { runDiagnostics } from '../controllers/diagController';

const router = Router();

// Esta rota responderá em GET /api/diag
router.get('/', runDiagnostics);

export default router;
