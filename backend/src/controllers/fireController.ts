import type { Request, Response, NextFunction } from 'express';
import firmsService from '../services/firmsService';
import FireHistory from '../models/FireHistory';
import logger from '../config/logger';
import type { FireApiResponse } from '../types';

export const getFires = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string, 10) || 1, 1), 60);
    const data = await firmsService.getFireData(days);

    void new FireHistory({
      timestamp: new Date(), source: 'NASA FIRMS', count: data.features.length,
      features: data.features.map(f => ({
        coordinates: f.geometry.coordinates, frp: f.properties.frp,
        confidence: f.properties.confidence, satellite: f.properties.satellite,
        instrument: f.properties.instrument, intensity: f.properties.intensity,
      })),
    }).save().catch((e: Error) => logger.warn(`[FIRMS] Historique: ${e.message}`));

    const response: FireApiResponse = {
      data,
      metadata: { source: 'NASA FIRMS (VIIRS + MODIS)', sensors: ['VIIRS', 'MODIS'], days, count: data.features.length, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) { next(error); }
};
