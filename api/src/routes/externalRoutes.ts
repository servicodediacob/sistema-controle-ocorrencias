import { Router } from 'express';
import { getDashboardDataForSso } from '@/controllers/dashboardController';
import { checkHealth } from '@/controllers/healthController';

const router = Router();

// Rotas públicas para consumo externo (sem autenticação)
router.get('/dashboard-ocorrencias', getDashboardDataForSso);
router.get('/health', checkHealth);

export default router;

