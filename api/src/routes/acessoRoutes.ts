import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { solicitarAcesso, listarSolicitacoes, gerenciarSolicitacao, solicitarAcessoGoogle } from '../controllers/acessoController';
import { getUnidades } from '../controllers/unidadesController';

const router = Router();

// Rota pública para solicitar acesso
router.post('/solicitar', solicitarAcesso);
router.post('/solicitar-google', solicitarAcessoGoogle);
// Lista de OBMs acessível antes do login (para o formulário público)
router.get('/obms-public', getUnidades);

// Rotas protegidas que exigem que o usuário seja um administrador
router.get('/', proteger, isAdmin, listarSolicitacoes);
router.put('/:id/gerenciar', proteger, isAdmin, gerenciarSolicitacao);

export default router;
