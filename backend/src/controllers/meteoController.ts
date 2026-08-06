import type { Request, Response, NextFunction } from 'express';
import meteoFranceService from '../services/meteoFranceService';

export const getWindData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await meteoFranceService.getWindData();
    res.json({ data, metadata: { source: 'Météo-France', count: data.features.length, timestamp: new Date().toISOString() } });
  } catch (e) { next(e); }
};
