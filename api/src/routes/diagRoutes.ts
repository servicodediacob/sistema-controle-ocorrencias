// Caminho: api/src/routes/diagRoutes.ts

import { Router } from 'express';
import { runDiagnostics } from '../controllers/diagController';
import verifySsoJwt from '../middleware/verifySsoJwt';

const router = Router();

// Esta rota responderá em GET /api/diag
router.get('/', runDiagnostics);
router.get('/sso-check', verifySsoJwt, (req, res) => {
  res.json({ status: 'ok', message: 'SSO token válido.' });
});

export default router;
