// Caminho: api/src/routes/plantaoRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import {
  getPlantao,
  // A importação de 'setOcorrenciaDestaque' foi REMOVIDA
  setSupervisorPlantao,
  getSupervisores
} from '../controllers/plantaoController';

const router = Router();

router.get('/', proteger, getPlantao);
router.get('/supervisores', proteger, getSupervisores);

// ======================= INÍCIO DA CORREÇÃO =======================
// A rota POST para '/destaque' que usava a função removida foi completamente EXCLUÍDA.
// router.post('/destaque', proteger, setOcorrenciaDestaque); // <--- ESTA LINHA FOI REMOVIDA
// ======================= FIM DA CORREÇÃO =======================

router.post('/supervisor', proteger, setSupervisorPlantao);

export default router;
