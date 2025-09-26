// Caminho: api/src/routes/ocorrenciaDetalhadaRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { 
  criarOcorrenciaDetalhada, 
  getOcorrenciasDetalhadasPorData 
} from '../controllers/ocorrenciaDetalhadaController';

const router = Router();

// ======================= INÍCIO DA CORREÇÃO =======================
// Passamos os handlers diretamente. O Express e o TypeScript irão inferir os tipos básicos (Request, Response).
// O middleware 'proteger' irá adicionar a propriedade 'usuario' ao 'req' antes de chegar no controller.
router.route('/')
  .post(proteger, criarOcorrenciaDetalhada)
  .get(proteger, getOcorrenciasDetalhadasPorData);
// ======================= FIM DA CORREÇÃO =======================

export default router;
