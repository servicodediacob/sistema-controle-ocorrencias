import { Request, Response } from 'express';
import db from '../db';
import logger from '../config/logger';

// Função auxiliar para medir o tempo de uma operação
const timePromise = async (promise: Promise<any>): Promise<[any, number]> => {
  const start = process.hrtime();
  const result = await promise;
  const end = process.hrtime(start);
  const durationMs = (end[0] * 1000) + (end[1] / 1_000_000);
  return [result, parseFloat(durationMs.toFixed(2))];
};

export const runDiagnostics = async (_req: Request, res: Response): Promise<void> => {
  logger.info('Iniciando diagnóstico geral do sistema...');
  
  const diagnostics = {
    geral: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    ambiente: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
    },
    database: {
      status: 'desconhecido',
      pingMs: 0,
      message: '',
    },
    // Adicione outras verificações aqui no futuro
  };

  // 1. Diagnóstico do Banco de Dados
  try {
    const [, duration] = await timePromise(db.query('SELECT NOW()'));
    diagnostics.database.status = 'ok';
    diagnostics.database.pingMs = duration;
    diagnostics.database.message = 'Conexão com o banco de dados bem-sucedida.';
  } catch (error) {
    diagnostics.geral.status = 'error';
    diagnostics.database.status = 'error';
    diagnostics.database.message = (error instanceof Error) ? error.message : 'Erro desconhecido na conexão.';
    logger.error({ err: error }, 'Diagnóstico falhou na verificação do banco de dados.');
  }

  // Se o status geral mudou para 'error', o código de status HTTP deve ser de erro
  const httpStatus = diagnostics.geral.status === 'ok' ? 200 : 503;

  logger.info(`Diagnóstico concluído com status: ${diagnostics.geral.status}` );
  
  res.status(httpStatus ).json(diagnostics);
};
