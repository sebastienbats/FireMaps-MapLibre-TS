import type { Request, Response, NextFunction } from 'express';
import copernicusService from '../services/copernicusService';
import type { BoundingBox } from '../types';

/**
 * GET /api/copernicus/burned-areas
 * ✅ Source réelle : NASA FIRMS MCD64A1 (zones brûlées mensuelles)
 */
export const getBurnedAreas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.query;

    let bbox: BoundingBox | null = null;
    if (minLon && minLat && maxLon && maxLat) {
      bbox = {
        minLon: parseFloat(minLon as string),
        minLat: parseFloat(minLat as string),
        maxLon: parseFloat(maxLon as string),
        maxLat: parseFloat(maxLat as string),
      };
    }

    const data = await copernicusService.getBurnedAreas(bbox);

    res.json({
      data,
      metadata: {
        source: data.metadata?.source || 'NASA FIRMS (MCD64A1)',
        product: 'Burned Areas',
        count: data.features.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/copernicus/fire-risk
 * ✅ Source réelle : EFFIS (European Forest Fire Information System — JRC)
 */
export const getFireRisk = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await copernicusService.getFireRisk();

    res.json({
      data,
      metadata: {
        source: data.metadata?.source || 'EFFIS (JRC)',
        product: 'Fire Risk',
        count: data.features.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
