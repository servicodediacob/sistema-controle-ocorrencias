import { Router } from 'express';
import {
  getDashboardDataForSso,
  getDashboardStats,
} from '@/controllers/dashboardController';
import { checkHealth } from '@/controllers/healthController';
import { getPlantao } from '@/controllers/plantaoController';
import { getRelatorioCompleto } from '@/controllers/relatorioController';
import {
  getEstatisticasAgrupadasPorIntervalo as getEstatisticasAgrupadasPorData,
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
router.get('/external/estatisticas-por-intervalo', verifySsoJwt, (req, res) => {
  const data = req.query.data ? new Date(req.query.data as string) : new Date();
  const dataInicio = new Date(data);
  dataInicio.setHours(0, 0, 0, 0);
  const dataFim = new Date(data);
  dataFim.setHours(23, 59, 59, 999);

  req.query.dataInicio = dataInicio.toISOString();
  req.query.dataFim = dataFim.toISOString();

  return getEstatisticasAgrupadasPorData(req as any, res);
});
router.get('/external/espelho-base', verifySsoJwt, getEspelhoBase);

export default router;
