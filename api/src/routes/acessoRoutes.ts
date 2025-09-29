import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { solicitarAcesso, listarSolicitacoes, gerenciarSolicitacao } from '../controllers/acessoController';

const router = Router();

// Rota pública para solicitar acesso
router.post('/solicitar', solicitarAcesso);

// Rotas protegidas que exigem que o usuário seja um administrador
router.get('/', proteger, isAdmin, listarSolicitacoes);
router.put('/:id/gerenciar', proteger, isAdmin, gerenciarSolicitacao);

export default router;
