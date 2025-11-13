import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import logger from '@/config/logger';
import { fetchSisgpoSessionToken } from '@/services/sisgpoAuthService';
import { RequestWithUser } from '@/middleware/authMiddleware';

const SISGPO_API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';
const ALLOWED_PREFIXES = [
  '/admin/plantoes',
  '/admin/viaturas',
  '/admin/obms',
  '/admin/militares',
  '/admin/escala-medicos',
  '/admin/escala-aeronaves',
  '/admin/escala-codec',
  '/admin/civis',
  '/admin/aeronaves',
  '/admin/metadata',
];

const isPathAllowed = (path: string): boolean =>
  ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));

const normalizeProxyPath = (wildcard?: string): string => {
  const suffix = wildcard ? `/${wildcard.replace(/^\/+/, '')}` : '';
  return suffix || '';
};

export const proxySisgpoRequest = async (req: RequestWithUser, res: Response): Promise<void> => {
  if (!req.usuario) {
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  const wildcardPath = normalizeProxyPath((req.params as Record<string, string | undefined>)[0]);

  if (!wildcardPath || !isPathAllowed(wildcardPath)) {
    res.status(400).json({ message: 'Rota do SISGPO não permitida para proxy.' });
    return;
  }

  let sisgpoJwt: string;
  try {
    sisgpoJwt = await fetchSisgpoSessionToken(req.usuario);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao autenticar no SISGPO via SSO.';
    res.status(500).json({ message });
    return;
  }

  const targetUrl = `${SISGPO_API_URL}/api${wildcardPath}`;

  try {
    const response = await axios.request({
      method: req.method as any,
      url: targetUrl,
      params: req.query,
      data: req.body,
      headers: {
        Authorization: `Bearer ${sisgpoJwt}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 204) {
      res.sendStatus(204);
      return;
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 500;
    const data =
      axiosError.response?.data ??
      { message: 'Erro ao comunicar com o SISGPO.', details: axiosError.message };

    logger.error({ err: axiosError, path: wildcardPath }, '[SISGPO] Falha ao proxiar requisição.');
    if (status === 204) {
      res.sendStatus(204);
    } else {
      res.status(status).json(data);
    }
  }
};
