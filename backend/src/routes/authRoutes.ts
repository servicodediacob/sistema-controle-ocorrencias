import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Rota de Login: POST /api/auth/login
router.post('/login', login);

export default router;
