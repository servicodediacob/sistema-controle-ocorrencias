// api/src/routes/obmRoutes.ts

import { Router } from 'express';
import { proteger, RequestWithUser } from '../middleware/authMiddleware';
import { getObmsPendentesPorIntervalo as getObmsPendentesPorData } from '../controllers/obmController';

const router = Router();

router.get('/pendentes-por-intervalo', proteger, (req, res) => getObmsPendentesPorData(req as RequestWithUser, res));

export default router;