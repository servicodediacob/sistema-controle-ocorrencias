import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  getPlantao,
  setOcorrenciaDestaque,
  setSupervisorPlantao,
  getSupervisores
} from '../controllers/plantaoController';

const router = Router();

router.get('/', proteger, getPlantao);
router.get('/supervisores', proteger, getSupervisores);
router.post('/destaque', proteger, setOcorrenciaDestaque);
router.post('/supervisor', proteger, setSupervisorPlantao);

export default router;
