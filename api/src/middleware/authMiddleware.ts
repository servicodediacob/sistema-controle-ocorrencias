import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// --- INÍCIO DA CORREÇÃO ---

// 1. Definimos uma interface para o payload do nosso token
interface JwtPayload {
  id: number;
  nome: string;
}

// 2. Criamos uma nova interface que estende a Request do Express e adiciona nossa propriedade 'usuario'
export interface RequestWithUser extends Request {
  usuario?: JwtPayload;
}

// 3. Usamos nossa nova interface 'RequestWithUser' em vez de 'Request' na assinatura da função
export const proteger = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  // --- FIM DA CORREÇÃO ---

  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      
      // Agora o TypeScript entende que 'req.usuario' existe
      req.usuario = { id: decoded.id, nome: decoded.nome };
      
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
