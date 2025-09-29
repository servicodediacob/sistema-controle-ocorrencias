import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import {
  getPlantao,
  setSupervisorPlantao,
  getSupervisores
} from '../controllers/plantaoController';

const router = Router();

// Todas as rotas de plantão são protegidas
router.use(proteger);

router.get('/', getPlantao);
router.get('/supervisores', getSupervisores);

// Apenas administradores podem definir o supervisor
router.post('/supervisor', isAdmin, setSupervisorPlantao);

export default router;
