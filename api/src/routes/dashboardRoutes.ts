// Caminho: api/src/routes/dashboardRoutes.ts

import { Router } from 'express';
import { getDashboardStats } from '@/controllers/dashboardController'; // Usando alias
import { proteger } from '@/middleware/authMiddleware'; // Usando alias

const router = Router();

// A rota GET /stats será acessível através de /api/dashboard/stats
router.get('/stats', proteger, getDashboardStats);

export default router;
