import type { Request, Response, NextFunction } from 'express';
import sdisService from '../services/sdisService';

export const getAllSdis = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await sdisService.getAll();
    res.json({ data, metadata: { source: 'SDIS', count: data.features.length, timestamp: new Date().toISOString() } });
  } catch (e) { next(e); }
};
