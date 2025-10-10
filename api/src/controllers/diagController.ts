// api/src/controllers/diagController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';
import logger from '../config/logger';

// Função auxiliar para medir o tempo de uma operação em milissegundos
const timePromise = async (promise: Promise<any>): Promise<[any, number]> => {
  const start = process.hrtime();
  try {
    const result = await promise;
    const end = process.hrtime(start);
    const durationMs = (end[0] * 1000) + (end[1] / 1_000_000);
    return [result, parseFloat(durationMs.toFixed(2))];
  } catch (error) {
    const end = process.hrtime(start);
    const durationMs = (end[0] * 1000) + (end[1] / 1_000_000);
    // Re-lança o erro para ser pego pelo bloco catch principal, mas com a duração
    throw { error, duration: parseFloat(durationMs.toFixed(2)) };
  }
};

interface IDiagnosticCheck {
  status: 'ok' | 'error' | 'degraded';
  message: string;
  durationMs?: number;
  details?: string;
}

interface IDiagnosticsReport {
  geral: {
    status: 'ok' | 'error' | 'degraded';
    timestamp: string;
  };
  servicos: {
    database: IDiagnosticCheck;
    auth: IDiagnosticCheck;
  };
}

export const runDiagnostics = async (_req: Request, res: Response): Promise<void> => {
  logger.info('Iniciando diagnóstico geral do sistema...');
  
  const report: IDiagnosticsReport = {
    geral: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    servicos: {
      database: { status: 'degraded', message: 'Verificação não executada' },
      auth: { status: 'degraded', message: 'Verificação não executada' },
    },
  };

  // 1. Diagnóstico do Banco de Dados
  try {
    const [, duration] = await timePromise(db.query('SELECT NOW()'));
    report.servicos.database = {
      status: 'ok',
      message: 'Conexão bem-sucedida.',
      durationMs: duration,
    };
  } catch (e: any) {
    report.servicos.database = {
      status: 'error',
      message: 'Falha na conexão com o banco de dados.',
      durationMs: e.duration,
      details: e.error instanceof Error ? e.error.message : 'Erro desconhecido.',
    };
    report.geral.status = 'error';
    logger.error({ err: e.error }, 'Diagnóstico falhou na verificação do banco de dados.');
  }

  // 2. Diagnóstico do Sistema de Autenticação (JWT)
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.');
    }
    const testPayload = { id: 'test' };
    const testToken = jwt.sign(testPayload, secret, { expiresIn: '1s' });
    jwt.verify(testToken, secret);
    report.servicos.auth = {
      status: 'ok',
      message: 'Segredo JWT está configurado e funcional.',
    };
  } catch (error: any) {
    report.servicos.auth = {
      status: 'error',
      message: 'Falha no sistema de autenticação.',
      details: error.message,
    };
    report.geral.status = 'error';
    logger.error({ err: error }, 'Diagnóstico falhou na verificação do JWT.');
  }

  const httpStatus = report.geral.status === 'ok' ? 200 : 503;
  logger.info(`Diagnóstico concluído com status: ${report.geral.status}` );
  
  res.status(httpStatus ).json(report);
};
