import { Router } from 'express';
import { login, googleLogin } from '../controllers/authController';

const router = Router();

// Rota de Login: POST /api/auth/login
router.post('/login', login);
router.post('/google', googleLogin);

export default router;
