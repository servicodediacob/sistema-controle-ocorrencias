// Caminho: api/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { createClient } from '@supabase/supabase-js';


// Supabase client (admin)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Interface para o payload do nosso token
export interface JwtPayload {
  id: number;
  role: 'admin' | 'user';
  obm_id: number | null;
  email?: string;
  nome: string;
  perfil?: 'admin' | 'user';
  obm_nome?: string | null;
}

// Estende a interface Request do Express para incluir nosso payload de usuário
export interface RequestWithUser extends Request {
  usuario?: JwtPayload;
}

export const proteger = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];

      // Tenta primeiro como token JWT legado
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.usuario = decoded;
        next();
        return;
      } catch (jwtError) {
        // Se falhou como JWT, tenta como token Supabase
        logger.debug('Token não é JWT legado, tentando Supabase...');
      }

      // Valida token com Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user?.email) {
        logger.warn({ err: error }, 'Token Supabase inválido');
        res.status(401).json({ message: 'Não autorizado, token inválido.' });
        return;
      }

      // Busca perfil do usuário na tabela usuarios via Supabase
      const { data: usuario, error: dbError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, nome, perfil, obm_id, obm:obms(nome)')
        .eq('email', user.email)
        .single();

      if (dbError || !usuario) {
        logger.warn({ email: user.email, error: dbError }, 'Usuário autenticado no Supabase mas não encontrado na base local');
        res.status(403).json({ message: 'Usuário não autorizado no sistema.' });
        return;
      }

      // Monta payload compatível
      req.usuario = {
        id: usuario.id,
        role: usuario.perfil as 'admin' | 'user',
        obm_id: usuario.obm_id,
        email: usuario.email,
        nome: usuario.nome,
        perfil: usuario.perfil as 'admin' | 'user',
        obm_nome: (usuario.obm as any)?.[0]?.nome || null
      };

      next();
      return;

    } catch (error) {
      logger.error({ err: error }, 'Erro no middleware de autenticação');
      res.status(401).json({ message: 'Erro na autenticação.' });
      return;
    }
  }

  res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
};
