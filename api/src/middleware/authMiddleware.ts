// Caminho: api/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

// Interface para o payload do nosso token
export interface JwtPayload {
  id: number;
  role: 'admin' | 'user';
  obm_id: number | null;
  email?: string;
  nome: string; // <-- CORREÇÃO: ADICIONAMOS A PROPRIEDADE 'nome'
  perfil?: 'admin' | 'user';
  obm_nome?: string | null;
}

// Estende a interface Request do Express para incluir nosso payload de usuário
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
      
      // Anexa os dados do usuário decodificados ao objeto da requisição
      req.usuario = decoded;
      
      next();
      return;

    } catch (error) {
      logger.warn({ err: error, token }, 'Falha na autenticação do token.');
      res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
  }
};
