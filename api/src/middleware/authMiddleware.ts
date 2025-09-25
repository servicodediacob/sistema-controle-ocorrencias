// Caminho: api/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// --- INÍCIO DA CORREÇÃO ---
// 1. ATUALIZAMOS A INTERFACE DO PAYLOAD DO TOKEN
interface JwtPayload {
  id: number;
  nome: string;
  role: 'admin' | 'user'; // Adicionamos a role
  obm_id: number | null;   // Adicionamos a OBM
}
// --- FIM DA CORREÇÃO ---

// A interface RequestWithUser não precisa de mudanças, pois ela já usa JwtPayload.
export interface RequestWithUser extends Request {
  usuario?: JwtPayload;
}

export const proteger = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      
      // Agora o TypeScript entende que o payload decodificado tem todas as propriedades.
      req.usuario = { 
        id: decoded.id, 
        nome: decoded.nome,
        role: decoded.role,
        obm_id: decoded.obm_id
      };
      
      next();
      return;
    } catch (error) {
      console.error('Erro de autenticação:', (error as Error).message);
      res.status(401).json({ message: 'Não autorizado, token inválido.' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    return;
  }
};
