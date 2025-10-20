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
  logger.info('Iniciando diagnostico geral do sistema...');

  const report: IDiagnosticsReport = {
    geral: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    servicos: {
      database: { status: 'degraded', message: 'Verificacao nao executada' },
      auth: { status: 'degraded', message: 'Verificacao nao executada' },
      sisgpo: { status: 'degraded', message: 'Verificacao nao executada' },
    },
  };

  // 1. Diagnostico do banco de dados
  try {
    const [, duration] = await timePromise(db.query('SELECT NOW()'));
    report.servicos.database = {
      status: 'ok',
      message: 'Conexao bem-sucedida.',
      durationMs: duration,
    };
  } catch (err: any) {
    report.servicos.database = {
      status: 'error',
      message: 'Falha na conexao com o banco de dados.',
      durationMs: err.duration,
      details: err.error instanceof Error ? err.error.message : 'Erro desconhecido.',
    };
    report.geral.status = 'error';
    logger.error({ err: err.error }, 'Diagnostico falhou na verificacao do banco de dados.');
  }

  // 2. Diagnostico do sistema de autenticacao (JWT)
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('A variavel de ambiente JWT_SECRET nao esta definida.');
    }
    const testPayload = { id: 'test' };
    const testToken = jwt.sign(testPayload, secret, { expiresIn: '1s' });
    jwt.verify(testToken, secret);
    report.servicos.auth = {
      status: 'ok',
      message: 'Segredo JWT esta configurado e funcional.',
    };
  } catch (error: any) {
    report.servicos.auth = {
      status: 'error',
      message: 'Falha no sistema de autenticacao.',
      details: error.message,
    };
    report.geral.status = 'error';
    logger.error({ err: error }, 'Diagnostico falhou na verificacao do JWT.');
  }

  // 3. Diagnostico do SISGPO
  const sisgpoCheck = await checkSisgpoStatus();
  report.servicos.sisgpo = sisgpoCheck;
  if (sisgpoCheck.status === 'error') {
    report.geral.status = 'error';
  } else if (sisgpoCheck.status === 'degraded' && report.geral.status === 'ok') {
    report.geral.status = 'degraded';
  }

  const httpStatus = report.geral.status === 'error' ? 503 : 200;
  logger.info(`Diagnostico concluido com status: ${report.geral.status}`);

  res.status(httpStatus).json(report);
};
