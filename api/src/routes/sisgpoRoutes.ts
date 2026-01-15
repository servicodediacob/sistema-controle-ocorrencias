import express, { Router } from 'express';
import {
  issueSisgpoPlantaoToken,
  getSisgpoSettings,
  getSisgpoViaturasEmpenhadas,
} from '@/controllers/sisgpoController';
import { proxySisgpoRequest } from '@/controllers/sisgpoProxyController';
import { proteger } from '@/middleware/authMiddleware';

const router = Router();

// Garante que requisições JSON/urlencoded cheguem ao proxy com o body preenchido.
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/plantao/sso-token', proteger, issueSisgpoPlantaoToken);
router.get('/settings', proteger, getSisgpoSettings);
router.get('/viaturas/empenhadas', proteger, getSisgpoViaturasEmpenhadas);
router.all('/proxy/*', proteger, proxySisgpoRequest);

export default router;
