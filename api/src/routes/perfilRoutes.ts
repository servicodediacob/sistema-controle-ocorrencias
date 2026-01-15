// Caminho: api/src/routes/perfilRoutes.ts

import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';
import { alterarPropriaSenha } from '../controllers/perfilController';

const router = Router();

// Aplica o middleware de proteção a todas as rotas deste arquivo
router.use(proteger);

// Rota para alterar a senha: PUT /api/perfil/alterar-senha
router.put('/alterar-senha', alterarPropriaSenha);

export default router;
