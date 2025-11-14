import axios from 'axios';
import { Request, Response } from 'express';
import logger from '@/config/logger';
import { RequestWithUser } from '@/middleware/authMiddleware';
import {
  fetchSisgpoSessionToken,
  generateSisgpoSsoToken,
  getSisgpoSsoTtlSeconds,
} from '@/services/sisgpoAuthService';

const SISGPO_BASE_URL = process.env.SISGPO_PUBLIC_URL || 'https://sisgpo.vercel.app';
const SISGPO_API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';
const SISGPO_DEFAULT_REDIRECT_PATH = process.env.SISGPO_PLANTOES_PATH || '/app/plantoes';
const SISGPO_SSO_ENTRY_PATH = process.env.SISGPO_SSO_ENTRY_PATH || '/sso/login';
const SISGPO_EMPENHO_CACHE_TTL_MS = Number(process.env.SISGPO_EMPENHO_CACHE_TTL_MS || 60_000);

type EmpenhoCache = {
  prefixes: string[];
  expiresAt: number;
  fetchedAt: string | null;
};

let viaturasEmpenhadasCache: EmpenhoCache = {
  prefixes: [],
  expiresAt: 0,
  fetchedAt: null,
};

const normalizePrefix = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
};

const parseSisgpoDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/').map(Number);
    return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp);
};

const shouldConsiderPlantao = (rawDate: string | undefined, today: Date): boolean => {
  if (!rawDate) {
    return true;
  }
  const parsed = parseSisgpoDate(rawDate);
  if (!parsed) {
    return true;
  }
  const normalized = new Date(parsed);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized >= today;
};

const fetchViaturasEmpenhadas = async (usuario: RequestWithUser['usuario']): Promise<string[]> => {
  const sisgpoToken = await fetchSisgpoSessionToken(usuario);
  const engaged = new Set<string>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString().split('T')[0];

  const limit = 200;
  let currentPage = 1;
  while (true) {
    const response = await axios.get(`${SISGPO_API_URL}/api/admin/plantoes`, {
      params: {
        page: currentPage,
        limit,
        data_inicio: todayIso,
      },
      headers: {
        Authorization: `Bearer ${sisgpoToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      const message =
        (response.data && (response.data as Record<string, unknown>).message) ||
        'Falha ao consultar os plantoes do SISGPO.';
      throw new Error(typeof message === 'string' ? message : 'Erro ao consultar os plantoes.');
    }

    const registros = Array.isArray(response.data?.data) ? response.data.data : [];
    registros.forEach((plantao: Record<string, any>) => {
      const prefix =
        normalizePrefix(plantao.viatura_prefixo) || normalizePrefix(plantao.viatura?.prefixo);
      if (!prefix) {
        return;
      }
      if (shouldConsiderPlantao(plantao.data_plantao, today)) {
        engaged.add(prefix);
      }
    });

    const pagination = response.data?.pagination;
    const pageFromPayload =
      Number(pagination?.currentPage ?? pagination?.current_page) || currentPage;
    const totalPages =
      Number(pagination?.totalPages ?? pagination?.total_pages) || pageFromPayload;

    if (!pagination || pageFromPayload >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return Array.from(engaged);
};

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

export const getSisgpoViaturasEmpenhadas = async (
  req: RequestWithUser,
  res: Response
): Promise<Response> => {
  const forceRefresh = req.query.force === 'true';
  const now = Date.now();

  if (!forceRefresh && viaturasEmpenhadasCache.expiresAt > now) {
    return res.json({
      engagedPrefixes: viaturasEmpenhadasCache.prefixes,
      cached: true,
      fetchedAt: viaturasEmpenhadasCache.fetchedAt,
    });
  }

  try {
    const prefixes = await fetchViaturasEmpenhadas(req.usuario);
    viaturasEmpenhadasCache = {
      prefixes,
      fetchedAt: new Date().toISOString(),
      expiresAt: now + SISGPO_EMPENHO_CACHE_TTL_MS,
    };

    return res.json({
      engagedPrefixes: prefixes,
      cached: false,
      fetchedAt: viaturasEmpenhadasCache.fetchedAt,
    });
  } catch (error) {
    logger.error({ err: error, usuarioId: req.usuario?.id }, '[SISGPO] Falha ao listar empenhos.');
    return res
      .status(500)
      .json({ message: 'Nao foi possivel atualizar o status das viaturas empenhadas.' });
  }
};
