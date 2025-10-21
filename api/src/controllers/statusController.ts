import { Request, Response } from 'express';

let lastProcessedTimestamp: number | null = null;

export const updateLastProcessedTimestamp = () => {
  lastProcessedTimestamp = Date.now();
};

export const getLastUpdateStatus = (_req: Request, res: Response) => {
  res.status(200).json({ lastProcessedTimestamp });
};
