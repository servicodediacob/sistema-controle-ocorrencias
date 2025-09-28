import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { 
  criarOcorrenciaDetalhada, 
  getOcorrenciasDetalhadasPorData,
  atualizarOcorrenciaDetalhada, // Importar
  deletarOcorrenciaDetalhada   // Importar
} from '../controllers/ocorrenciaDetalhadaController';

const router = Router();

// Rota para criar (POST) e listar (GET)
router.route('/')
  .post(proteger, criarOcorrenciaDetalhada)
  .get(proteger, getOcorrenciasDetalhadasPorData);

// ======================= INÍCIO DA CORREÇÃO =======================
// Adiciona as rotas para atualizar (PUT) e deletar (DELETE) por ID
router.route('/:id')
  .put(proteger, atualizarOcorrenciaDetalhada)
  .delete(proteger, deletarOcorrenciaDetalhada);
// ======================= FIM DA CORREÇÃO =======================

export default router;
