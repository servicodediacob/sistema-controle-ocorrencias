import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { 
  criarOcorrenciaDetalhada, 
  getOcorrenciasDetalhadasPorIntervalo as getOcorrenciasDetalhadasPorData,
  atualizarOcorrenciaDetalhada,
  deletarOcorrenciaDetalhada
} from '../controllers/ocorrenciaDetalhadaController';

const router = Router();

// Todas as rotas aqui são protegidas, exigindo um token válido
router.use(proteger);

router.route('/')
  .post(criarOcorrenciaDetalhada)

router.get('/por-intervalo', getOcorrenciasDetalhadasPorData);

router.route('/:id')
  .put(atualizarOcorrenciaDetalhada)
  .delete(deletarOcorrenciaDetalhada);

export default router;