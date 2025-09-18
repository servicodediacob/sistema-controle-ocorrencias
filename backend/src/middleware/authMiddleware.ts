import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

interface JwtPayload {
  id: number;
  nome: string;
}

export const proteger = (req: Request, res: Response, next: NextFunction): void => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      req.usuario = { id: decoded.id, nome: decoded.nome };
      next();
      return; // Saída explícita após chamar next()
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
