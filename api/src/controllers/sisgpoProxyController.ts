import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import logger from '@/config/logger';
import { fetchSisgpoSessionToken } from '@/services/sisgpoAuthService';
import { RequestWithUser } from '@/middleware/authMiddleware';

const SISGPO_API_URL = (process.env.SISGPO_API_URL || 'http://localhost:3333').trim();
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
  } catch (error: any) {
    const isConnectionError = error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';

    let message: string;
    if (isConnectionError) {
      message = 'Não foi possível conectar ao SISGPO. Verifique se o serviço está rodando.';
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'Falha ao autenticar no SISGPO via SSO.';
    }

    res.status(503).json({ message });
    return;
  }

  const targetUrl = `${SISGPO_API_URL}/api${wildcardPath}`;
  
  // Log the request details for debugging
  logger.info({
    targetUrl,
    method: req.method,
    params: req.query,
    wildcardPath,
    sisgpoApiUrl: SISGPO_API_URL,
  }, '[SISGPO Proxy] Forwarding request to SISGPO');

  const incomingIfMatch = req.headers['if-match'];
  const contentType = req.headers['content-type'];
  const isMultipart = typeof contentType === 'string' && contentType.startsWith('multipart/form-data');

  const outgoingHeaders: Record<string, string | string[] | undefined> = {
    Authorization: `Bearer ${sisgpoJwt}`,
    'Content-Type': contentType,
  };
  if (typeof incomingIfMatch === 'string' && incomingIfMatch.trim()) {
    outgoingHeaders['If-Match'] = incomingIfMatch;
  }

  // Para JSON/urlencoded usamos req.body (já parseado). Para multipart encaminhamos o stream bruto.
  const data = isMultipart ? req : req.body;

  try {
    const response = await axios.request({
      method: req.method as any,
      url: targetUrl,
      params: req.query,
      data,
      headers: outgoingHeaders,
      validateStatus: () => true,
    });

    const eTagValue =
      (response.headers?.etag as string | undefined) ??
      (response.headers?.ETag as string | undefined);
    if (eTagValue) {
      res.setHeader('ETag', eTagValue);
    }

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
