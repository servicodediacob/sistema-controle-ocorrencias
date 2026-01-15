// api/src/controllers/diagController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios, { AxiosError } from 'axios';
import db from '../db';
import logger from '../config/logger';

type DiagnosticStatus = 'ok' | 'error' | 'degraded';

const toDurationMs = (elapsed: [number, number]): number => {
  const duration = (elapsed[0] * 1000) + (elapsed[1] / 1_000_000);
  return parseFloat(duration.toFixed(2));
};

// Helper to measure the execution time of a promise and return it alongside the result.
const timePromise = async <T>(promise: Promise<T>): Promise<[T, number]> => {
  const start = process.hrtime();
  try {
    const result = await promise;
    const end = process.hrtime(start);
    return [result, toDurationMs(end)];
  } catch (error) {
    const end = process.hrtime(start);
    throw { error, duration: toDurationMs(end) };
  }
};

interface IDiagnosticCheck {
  status: DiagnosticStatus;
  message: string;
  durationMs?: number;
  details?: string;
}

interface IDiagnosticsReport {
  geral: {
    status: DiagnosticStatus;
    timestamp: string;
  };
  servicos: {
    database: IDiagnosticCheck;
    auth: IDiagnosticCheck;
    sisgpo: IDiagnosticCheck;
  };
}

const stringifyDetails = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value ?? {});
  } catch (err) {
    return 'Nao foi possivel serializar detalhes adicionais.';
  }
};

const checkSisgpoStatus = async (): Promise<IDiagnosticCheck> => {
  const url = process.env.SISGPO_HEALTH_URL;
  if (!url) {
    logger.warn('[Diag] SISGPO_HEALTH_URL nao configurada.');
    return {
      status: 'degraded',
      message: 'Variavel SISGPO_HEALTH_URL nao configurada.',
    };
  }

  const start = process.hrtime();
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    const durationMs = toDurationMs(process.hrtime(start));
    const data = response.data as any;
    const statusFlag = data?.status ?? data?.healthy;
    const isHealthy = response.status === 200 && (statusFlag === 'ok' || statusFlag === true);

    if (isHealthy) {
      return {
        status: 'ok',
        message: 'SISGPO respondeu com status OK.',
        durationMs,
      };
    }

    return {
      status: 'error',
      message: `Resposta inesperada do SISGPO (HTTP ${response.status}).`,
      durationMs,
      details: stringifyDetails(data),
    };
  } catch (error) {
    const durationMs = toDurationMs(process.hrtime(start));

    let details = 'Erro desconhecido.';
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      details = stringifyDetails(
        axiosError.response?.data ?? axiosError.message ?? 'Erro ao consultar SISGPO.',
      );
    } else if (error instanceof Error) {
      details = error.message;
    }

    logger.error({ err: error }, '[Diag] Falha ao consultar health check do SISGPO.');
    return {
      status: 'degraded',
      message: 'SISGPO nao respondeu ao health check.',
      durationMs,
      details,
    };
  }
};

export const runDiagnostics = async (_req: Request, res: Response): Promise<void> => {
  const timestamp = new Date().toISOString();

  // 1. Verifica conexão com o banco de dados (consulta simples)
  let database: IDiagnosticCheck;
  try {
    const [, durationMs] = await timePromise(db.query('SELECT 1'));
    database = {
      status: 'ok',
      message: 'Consulta básica ao banco executada com sucesso.',
      durationMs,
    };
  } catch (err) {
    const failure = err as { error?: unknown; duration?: number };
    logger.error({ err: failure?.error ?? err }, '[Diag] Falha ao consultar o banco de dados.');
    database = {
      status: 'error',
      message: 'Falha ao executar consulta básica no banco de dados.',
      durationMs: failure?.duration,
      details: stringifyDetails(failure?.error),
    };
  }

  // 2. Valida configuração de autenticação (JWT secret)
  let auth: IDiagnosticCheck;
  const authStart = process.hrtime();
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    auth = {
      status: 'error',
      message: 'JWT_SECRET não configurado.',
      durationMs: toDurationMs(process.hrtime(authStart)),
    };
  } else {
    try {
      const token = jwt.sign({ ping: true }, jwtSecret, { expiresIn: '1m' });
      jwt.verify(token, jwtSecret);
      auth = {
        status: 'ok',
        message: 'Segredo JWT válido.',
        durationMs: toDurationMs(process.hrtime(authStart)),
      };
    } catch (error) {
      logger.error({ err: error }, '[Diag] Falha ao validar JWT_SECRET.');
      auth = {
        status: 'error',
        message: 'Falha ao validar JWT_SECRET.',
        durationMs: toDurationMs(process.hrtime(authStart)),
        details: stringifyDetails(error instanceof Error ? error.message : error),
      };
    }
  }

  // 3. Consulta serviço externo SISGPO (se configurado)
  const sisgpo = await checkSisgpoStatus();

  const services: IDiagnosticsReport['servicos'] = {
    database,
    auth,
    sisgpo,
  };

  const serviceStatuses = Object.values(services).map((svc) => svc.status);
  let geralStatus: DiagnosticStatus = 'ok';
  if (serviceStatuses.includes('error')) {
    geralStatus = 'error';
  } else if (serviceStatuses.includes('degraded')) {
    geralStatus = 'degraded';
  }

  const report: IDiagnosticsReport = {
    geral: {
      status: geralStatus,
      timestamp,
    },
    servicos: services,
  };

  const statusCode = geralStatus === 'error' ? 500 : 200;
  res.status(statusCode).json(report);
};
