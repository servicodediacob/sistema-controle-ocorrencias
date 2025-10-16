import { Router } from 'express';
import {
  getDashboardDataForSso,
  getDashboardStats,
} from '@/controllers/dashboardController';
import { checkHealth } from '@/controllers/healthController';
import { getPlantao } from '@/controllers/plantaoController';
import { getRelatorioCompleto } from '@/controllers/relatorioController';
import {
  getEstatisticasAgrupadasPorData,
  getEspelhoBase,
} from '@/controllers/estatisticasController';
import verifySsoJwt from '@/middleware/verifySsoJwt';

const router = Router();

// Health permanece público para monitoramento
router.get('/health', checkHealth);

// Rotas protegidas por SSO
router.get('/dashboard-ocorrencias', verifySsoJwt, getDashboardDataForSso);
router.get('/external/dashboard', verifySsoJwt, getDashboardDataForSso);
router.get('/external/dashboard/stats', verifySsoJwt, getDashboardStats);
router.get('/external/plantao', verifySsoJwt, getPlantao);
router.get('/external/relatorio-completo', verifySsoJwt, getRelatorioCompleto);
router.get('/external/estatisticas-por-data', verifySsoJwt, (req, res) => {
  if (!req.query.data) {
    req.query.data = new Date().toISOString().split('T')[0];
  }
  return getEstatisticasAgrupadasPorData(req as any, res);
});
router.get('/external/espelho-base', verifySsoJwt, getEspelhoBase);

export default router;
