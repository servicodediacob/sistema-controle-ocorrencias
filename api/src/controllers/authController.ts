// api/src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma'; // Importando o Prisma Client
import logger from '@/config/logger';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    return;
  }

  try {
    // Busca o usuário e sua OBM associada usando o Prisma
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        obm: true, // Inclui os dados da OBM relacionada
      },
    });

    if (!usuario) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // ======================= INÍCIO DA CORREÇÃO =======================
    // Adicionado 'await' para esperar o resultado da comparação da senha.
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    // ======================= FIM DA CORREÇÃO =======================

    if (!senhaValida) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      logger.error('[AUTH] A variável de ambiente JWT_SECRET não está definida!');
      res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
      return;
    }

    const tokenPayload = {
      id: usuario.id,
      nome: usuario.nome,
      role: usuario.role,
      perfil: usuario.role, // Mantido para compatibilidade com frontend
      obm: usuario.obm ? { id: usuario.obm.id, nome: usuario.obm.nome } : null,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({ token });

  } catch (error) {
    logger.error({ err: error }, `[AUTH] Erro inesperado durante o login para ${email}`);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
