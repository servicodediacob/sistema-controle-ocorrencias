import { Request, Response } from 'express';
import logger from '@/config/logger';
import { RequestWithUser } from '@/middleware/authMiddleware';
import { generateSisgpoSsoToken, getSisgpoSsoTtlSeconds } from '@/services/sisgpoAuthService';

const SISGPO_BASE_URL = process.env.SISGPO_PUBLIC_URL || 'https://sisgpo.vercel.app';
const SISGPO_DEFAULT_REDIRECT_PATH = process.env.SISGPO_PLANTOES_PATH || '/app/plantoes';
const SISGPO_SSO_ENTRY_PATH = process.env.SISGPO_SSO_ENTRY_PATH || '/sso/login';

const buildSisgpoUrl = (
  relativePath: string,
  token: string,
  extraParams: Record<string, string | undefined>
): string => {
  const path = relativePath || SISGPO_SSO_ENTRY_PATH;

  try {
    const url = new URL(path, SISGPO_BASE_URL);
    url.searchParams.set('token', token);

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch (error) {
    logger.warn(
      { err: error, SISGPO_BASE_URL, SISGPO_DEFAULT_REDIRECT_PATH, SISGPO_SSO_ENTRY_PATH },
      '[SISGPO] Falha ao montar URL. Usando concatenacao simples.'
    );
    const trimmedBase = SISGPO_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const query = new URLSearchParams(
      Object.entries({ token, ...extraParams })
        .filter(([, value]) => Boolean(value)) as [string, string][]
    );
    return `${trimmedBase}${normalizedPath}?${query.toString()}`;
  }
};

export const issueSisgpoPlantaoToken = async (
  req: RequestWithUser,
  res: Response
): Promise<Response> => {
  try {
    const { viaturaId, dataPlantao, turno, redirectPath } = req.query as Record<
      string,
      string | undefined
    >;

    const token = await generateSisgpoSsoToken(req.usuario, {
      viaturaId,
      dataPlantao,
      turno,
    });
    const normalizedRedirect =
      redirectPath && redirectPath.startsWith('/') ? redirectPath : SISGPO_DEFAULT_REDIRECT_PATH;

    const redirectUrl = buildSisgpoUrl(SISGPO_SSO_ENTRY_PATH, token, {
      viaturaId,
      dataPlantao,
      turno,
      redirect: normalizedRedirect,
    });

    return res.json({
      token,
      expiresIn: getSisgpoSsoTtlSeconds(),
      redirectUrl,
    });
  } catch (error) {
    logger.error({ err: error, usuarioId: req.usuario?.id }, '[SISGPO] Falha ao gerar token de SSO.');
    return res.status(500).json({ message: 'Nao foi possivel gerar o token de SSO.' });
  }
};

export const getSisgpoSettings = (_req: Request, res: Response): Response => {
  return res.json({
    baseUrl: SISGPO_BASE_URL,
    plantoesPath: SISGPO_DEFAULT_REDIRECT_PATH,
    ssoEntryPath: SISGPO_SSO_ENTRY_PATH,
    ttlSeconds: getSisgpoSsoTtlSeconds(),
  });
};
