// backend/src/routes/acessoRoutes.ts
import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { solicitarAcesso, listarSolicitacoes, gerenciarSolicitacao } from '../controllers/acessoController';

const router = Router();

router.post('/solicitar', solicitarAcesso);
router.get('/', proteger, isAdmin, listarSolicitacoes);
router.put('/:id/gerenciar', proteger, isAdmin, gerenciarSolicitacao);

export default router;
