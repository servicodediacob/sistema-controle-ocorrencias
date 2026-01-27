import express, { Router } from 'express';
import {
  issueSisgpoPlantaoToken,
  getSisgpoSettings,
  getSisgpoViaturasEmpenhadas,
} from '@/controllers/sisgpoController';
import { proxySisgpoRequest } from '@/controllers/sisgpoProxyController';
import { handleReplicationWebhook } from '@/controllers/replicationController';
import { getMilitaresSisgpo, getMilitarSisgpoPorId } from '@/controllers/militaresController';
import { getViaturasSisgpo, getViaturaSisgpoPorId } from '@/controllers/viaturasController';
import { proteger } from '@/middleware/authMiddleware';

const router = Router();

// Garante que requisições JSON/urlencoded cheguem ao proxy com o body preenchido.
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/replication/webhook', handleReplicationWebhook);

// Militares (do Banco Replicado)
router.get('/militares', proteger, getMilitaresSisgpo);
router.get('/militares/:id', proteger, getMilitarSisgpoPorId);

// Viaturas (do Banco Replicado)
router.get('/viaturas', proteger, getViaturasSisgpo);
router.get('/viaturas/:id', proteger, getViaturaSisgpoPorId);

router.get('/plantao/sso-token', proteger, issueSisgpoPlantaoToken);
router.get('/settings', proteger, getSisgpoSettings);
router.get('/viaturas/empenhadas', proteger, getSisgpoViaturasEmpenhadas);
router.all('/proxy/*', proteger, proxySisgpoRequest);

export default router;
