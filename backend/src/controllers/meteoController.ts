import type { Request, Response, NextFunction } from 'express';
import meteoFranceService from '../services/meteoFranceService';

/**
 * GET /api/meteo/wind
 * ✅ Source réelle : Météo-France /v1/forecast (extraction du vent)
 * Note : l'endpoint /v1/wind n'existe pas, on utilise /v1/forecast
 */
export const getWindData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await meteoFranceService.getWindData();

    res.json({
      data,
      metadata: {
        source: 'Météo-France',
        count: data.features.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
