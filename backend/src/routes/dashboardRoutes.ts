import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { proteger } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', proteger, getDashboardStats);

export default router;
