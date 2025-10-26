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
  // Health check deve ser simples e rápido.
  // Apenas confirma que o servidor web está de pé e respondendo.
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};
