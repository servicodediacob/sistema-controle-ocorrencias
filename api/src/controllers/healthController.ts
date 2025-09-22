import { Request, Response } from 'express';
import db from '../db';
import logger from '../config/logger'; // <-- IMPORTE O LOGGER

export const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      message: 'API está saudável e conectada ao banco de dados.' 
    });
  } catch (error) {
    // USE O LOGGER PARA REGISTRAR O ERRO COMPLETO
    logger.error({ err: error }, '❌ Health Check falhou: Falha na conexão com o banco de dados.');
    res.status(503).json({ 
      status: 'error', 
      message: 'API está com problemas. Falha na conexão com o banco de dados.' 
    });
  }
};
