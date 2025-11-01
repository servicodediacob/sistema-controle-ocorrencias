// Caminho: api/src/routes/auditoriaRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { listarLogs, registrarNavegacao, registrarGeracaoRelatorio, registrarAberturaChat, registrarFechamentoChat, registrarMensagemChat } from '../controllers/auditoriaController';

const router = Router();

// The navigation logging should be protected, but not restricted to admins
router.post('/navigation', proteger, registrarNavegacao);

router.post('/relatorio', proteger, registrarGeracaoRelatorio);

router.post('/chat/abertura', proteger, registrarAberturaChat);

router.post('/chat/fechamento', proteger, registrarFechamentoChat);

router.post('/chat/mensagem', proteger, registrarMensagemChat);

// Protege as rotas de listagem de logs e exige que o usuário seja admin
router.get('/', proteger, isAdmin, listarLogs);

export default router;
