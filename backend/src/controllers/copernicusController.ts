import type { Request, Response, NextFunction } from 'express';
import copernicusService from '../services/copernicusService';
import type { BoundingBox } from '../types';

export const getBurnedAreas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.query;
    let bbox: BoundingBox | null = null;
    if (minLon && minLat && maxLon && maxLat) {
      bbox = { minLon: +minLon, minLat: +minLat, maxLon: +maxLon, maxLat: +maxLat };
    }
    const data = await copernicusService.getBurnedAreas(bbox);
    res.json({ data, metadata: { source: 'Copernicus EMS', product: 'Burned Areas', count: data.features.length, timestamp: new Date().toISOString() } });
  } catch (e) { next(e); }
};

export const getFireRisk = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await copernicusService.getFireRisk();
    res.json({ data, metadata: { source: 'Copernicus EMS', product: 'Fire Risk', count: data.features.length, timestamp: new Date().toISOString() } });
  } catch (e) { next(e); }
};
