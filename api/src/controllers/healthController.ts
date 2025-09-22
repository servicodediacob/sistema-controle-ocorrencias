import { Request, Response } from 'express';
import db from '../db';

export const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Tenta fazer uma consulta simples e rápida ao banco de dados.
    // Isso verifica se a API está de pé E se a conexão com o banco está funcionando.
    await db.query('SELECT 1');
    
    // Se a consulta for bem-sucedida, retorna status 200.
    res.status(200).json({ 
      status: 'ok', 
      message: 'API está saudável e conectada ao banco de dados.' 
    });

  } catch (error) {
    // Se a consulta falhar, retorna um erro 503.
    console.error('❌ Health Check falhou:', error);
    res.status(503).json({ 
      status: 'error', 
      message: 'API está com problemas. Falha na conexão com o banco de dados.' 
    });
  }
};
