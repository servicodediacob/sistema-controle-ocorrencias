// Caminho: api/src/routes/auditoriaRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { listarLogs } from '../controllers/auditoriaController';

const router = Router();

// Protege todas as rotas de auditoria e exige que o usuário seja admin
router.use(proteger, isAdmin);

router.get('/', listarLogs);

export default router;
