// Caminho: api/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// 1. Esta é a ÚNICA definição de JwtPayload que vamos usar.
export interface JwtPayload {
  id: number;
  nome: string;
  role: 'admin' | 'user';
  obm_id: number | null;
}

// 2. A interface RequestWithUser agora estende a Request padrão do Express E a nossa propriedade 'usuario'.
export interface RequestWithUser extends Request {
  usuario?: JwtPayload;
}

export const proteger = (req: Request, res: Response, next: NextFunction): void => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      
      // 3. Adicionamos a propriedade 'usuario' ao objeto 'req' dinamicamente.
      // Para fazer isso de forma segura com TypeScript, fazemos um cast do 'req' para 'any'.
      (req as any).usuario = decoded;
      
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
