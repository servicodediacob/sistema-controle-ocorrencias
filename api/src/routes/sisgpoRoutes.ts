import { Router } from 'express';
import { issueSisgpoPlantaoToken, getSisgpoSettings } from '@/controllers/sisgpoController';
import { proxySisgpoRequest } from '@/controllers/sisgpoProxyController';
import { proteger } from '@/middleware/authMiddleware';

const router = Router();

router.get('/plantao/sso-token', proteger, issueSisgpoPlantaoToken);
router.get('/settings', proteger, getSisgpoSettings);
router.all('/proxy/*', proteger, proxySisgpoRequest);

export default router;
