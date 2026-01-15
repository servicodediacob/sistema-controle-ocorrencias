// api/src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma'; // Importando o Prisma Client
import { OAuth2Client } from 'google-auth-library';
import { notifyAdmins } from '@/services/socketService';
import logger from '@/config/logger';
import { registrarAcao } from '@/services/auditoriaService';
import { RequestWithUser } from '@/middleware/authMiddleware';

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
      await registrarAcao(req as RequestWithUser, 'LOGIN_FALHA', { email, motivo: 'Usuário não encontrado' });
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // ======================= INÍCIO DA CORREÇÃO =======================
    // Adicionado 'await' para esperar o resultado da comparação da senha.
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    // ======================= FIM DA CORREÇÃO =======================

    if (!senhaValida) {
      await registrarAcao(req as RequestWithUser, 'LOGIN_FALHA', { email, motivo: 'Senha inválida' });
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      logger.error('[AUTH] A variável de ambiente JWT_SECRET não está definida!');
      res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
      return;
    }

    // Attach user to request for audit logging
    (req as RequestWithUser).usuario = usuario;

    await registrarAcao(req as RequestWithUser, 'LOGIN_SUCESSO', { email });

    const tokenPayload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      perfil: usuario.role, // Mantido para compatibilidade com frontend
      obm_id: usuario.obm_id ?? (usuario.obm ? usuario.obm.id : null),
      obm_nome: usuario.obm?.nome ?? null,
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

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { id_token } = req.body as { id_token?: string };
  if (!id_token) {
    res.status(400).json({ message: 'id_token é obrigatório.' });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID não está definida. O login com Google não funcionará.');
    logger.error('[AUTH] GOOGLE_CLIENT_ID não definido no ambiente');
    res.status(500).json({ message: 'Configuração OAuth ausente.' });
    return;
  }

  try {
    const oauthClient = new OAuth2Client(clientId);
    const ticket = await oauthClient.verifyIdToken({ idToken: id_token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      await registrarAcao(req as RequestWithUser, 'LOGIN_GOOGLE_FALHA', { motivo: 'Token inválido' });
      res.status(401).json({ message: 'Token inválido.' });
      return;
    }

    const email = payload.email;
    const nome = payload.name || email.split('@')[0];

    // Usuário já existe? Faz login normal
    const usuario = await prisma.usuario.findUnique({ where: { email }, include: { obm: true } });
    if (usuario) {
      // Attach user to request for audit logging
      (req as RequestWithUser).usuario = usuario;
      await registrarAcao(req as RequestWithUser, 'LOGIN_GOOGLE_SUCESSO', { email });

      if (!process.env.JWT_SECRET) { res.status(500).json({ message: 'JWT_SECRET ausente.' }); return; }
      const tokenPayload = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        perfil: usuario.role,
        obm_id: usuario.obm_id ?? (usuario.obm ? usuario.obm.id : null),
        obm_nome: usuario.obm?.nome ?? null,
        obm: usuario.obm ? { id: usuario.obm.id, nome: usuario.obm.nome } : null,
      };
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ token });
      return;
    }

    // Não existe: sinaliza necessidade de aprovação
    await registrarAcao(req as RequestWithUser, 'LOGIN_GOOGLE_PRIMEIRO_ACESSO', { email });

    // Opcional: notificar admins que houve tentativa de acesso Google ainda não cadastrada
    try {
      notifyAdmins('acesso:google-primeiro-login', { nome, email, quando: new Date().toISOString() });
    } catch (e) {
      logger.warn({ err: e }, '[AUTH] Falha ao notificar admins sobre first-login Google');
    }

    res.status(200).json({ needsApproval: true, profile: { nome, email } });
  } catch (error) {
    logger.error({ err: error }, '[AUTH] Erro ao verificar token Google');
    res.status(401).json({ message: 'Falha na autenticação Google.' });
  }
};
