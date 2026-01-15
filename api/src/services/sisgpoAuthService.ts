import jwt from 'jsonwebtoken';
import axios from 'axios';
import logger from '@/config/logger';
import { prisma } from '@/lib/prisma';
import { RequestWithUser, JwtPayload as AuthJwtPayload } from '@/middleware/authMiddleware';

const SISGPO_API_URL = (process.env.SISGPO_API_URL || 'http://localhost:3333').trim();
const SHARED_SECRET = process.env.SSO_SHARED_SECRET;
const SISGPO_SSO_TTL_SECONDS = Number(process.env.SISGPO_SSO_TTL_SECONDS || 90);

type UserLike = Pick<AuthJwtPayload, 'id' | 'nome' | 'email'> | RequestWithUser['usuario'];

const resolveUserEmail = async (usuario?: UserLike | null): Promise<string> => {
  if (usuario?.email) {
    return usuario.email;
  }

  if (usuario?.id) {
    const userRecord = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: { email: true },
    });

    if (userRecord?.email) {
      return userRecord.email;
    }
  }

  throw new Error('O usuário autenticado não possui e-mail cadastrado para integração com o SISGPO.');
};

export const generateSisgpoSsoToken = async (
  usuario: UserLike | undefined,
  extraClaims: Record<string, unknown> = {}
): Promise<string> => {
  if (!SHARED_SECRET) {
    throw new Error('SSO_SHARED_SECRET não configurado para integração com o SISGPO.');
  }

  const email = await resolveUserEmail(usuario);

  const payload: Record<string, unknown> = {
    sub: usuario?.id,
    nome: usuario?.nome,
    email,
    origem: 'sistema-ocorrencias',
    ...extraClaims,
  };

  return jwt.sign(payload, SHARED_SECRET, { expiresIn: SISGPO_SSO_TTL_SECONDS });
};

export const fetchSisgpoSessionToken = async (
  usuario: UserLike | undefined
): Promise<string> => {
  const ssoToken = await generateSisgpoSsoToken(usuario);

  const targetUrl = `${SISGPO_API_URL}/api/auth/sso-login`;
  
  try {
    const response = await axios.post(
      targetUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${ssoToken}`,
        },
      }
    );

    if (!response.data?.token) {
      throw new Error('Resposta do SISGPO não contém token de sessão.');
    }

    return response.data.token;
  } catch (error: any) {
    const isConnectionError = error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';
    
    if (isConnectionError) {
      logger.error(
        { err: error, url: targetUrl, code: error?.code },
        '[SISGPO] Falha ao conectar com o SISGPO. Verifique se o serviço está rodando e a URL está correta.'
      );
    } else {
      logger.error(
        { err: error, url: targetUrl },
        '[SISGPO] Falha ao obter token de sessão via SSO.'
      );
    }
    
    throw error;
  }
};

export const getSisgpoSsoTtlSeconds = (): number => SISGPO_SSO_TTL_SECONDS;
