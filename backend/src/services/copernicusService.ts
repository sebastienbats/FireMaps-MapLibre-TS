import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { BurnedAreaCollection, FireRiskCollection, BoundingBox, BurnSeverityType, RiskLevelType } from '../types';

const cache = new NodeCache({ stdTTL: 3600 });
const API = 'https://emergency.copernicus.eu/api/v1';

class CopernicusService {
  async getBurnedAreas(bbox: BoundingBox | null = null): Promise<BurnedAreaCollection> {
    const key = `cop_burned_${JSON.stringify(bbox)}`;
    const cached = cache.get<BurnedAreaCollection>(key);
    if (cached) return cached;

    const apiKey = process.env.COPERNICUS_API_KEY;
    if (!apiKey) return this.emptyBurned();

    try {
      const params: Record<string, string> = { product: 'burned_areas', format: 'geojson' };
      if (bbox) params.bbox = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;

      const res = await axios.get(`${API}/products`, {
        params,
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/geo+json' },
        timeout: 30_000,
      });

      const result = this.mapBurned(res.data);
      cache.set(key, result);
      logger.info(`[Copernicus] ${result.features.length} zones brûlées`);
      return result;
    } catch (e) {
      logger.error(`[Copernicus] ${e instanceof Error ? e.message : e}`);
      return this.emptyBurned();
    }
  }

  async getFireRisk(): Promise<FireRiskCollection> {
    const cached = cache.get<FireRiskCollection>('cop_risk');
    if (cached) return cached;

    const apiKey = process.env.COPERNICUS_API_KEY;
    if (!apiKey) return this.emptyRisk();

    try {
      const res = await axios.get(`${API}/risk/fire`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/geo+json' },
        timeout: 30_000,
      });
      const result = this.mapRisk(res.data);
      cache.set('cop_risk', result);
      logger.info(`[Copernicus] ${result.features.length} zones à risque`);
      return result;
    } catch (e) {
      logger.error(`[Copernicus] ${e instanceof Error ? e.message : e}`);
      return this.emptyRisk();
    }
  }

  private mapBurned(data: unknown): BurnedAreaCollection {
    const raw = data as { features?: Array<{ geometry: unknown; properties: Record<string, unknown> }> };
    if (!raw?.features) return this.emptyBurned();
    return {
      type: 'FeatureCollection',
      features: raw.features.map(f => ({
        type: 'Feature' as const,
        geometry: f.geometry as BurnedAreaCollection['features'][0]['geometry'],
        properties: {
          ...f.properties,
          severity: this.severity(f.properties),
          product: 'Burned Areas' as const,
          source: 'Copernicus EMS' as const,
        },
      })),
      metadata: { source: 'Copernicus EMS', product: 'Burned Areas', count: raw.features.length, generatedAt: new Date().toISOString() },
    };
  }

  private mapRisk(data: unknown): FireRiskCollection {
    const raw = data as { features?: Array<{ geometry: unknown; properties: Record<string, unknown> }> };
    if (!raw?.features) return this.emptyRisk();
    return {
      type: 'FeatureCollection',
      features: raw.features.map(f => ({
        type: 'Feature' as const,
        geometry: f.geometry as FireRiskCollection['features'][0]['geometry'],
        properties: {
          ...f.properties,
          riskLevel: this.riskLevel(f.properties.risk_index as number | undefined),
          product: 'Fire Risk' as const,
          source: 'Copernicus EMS' as const,
        },
      })),
      metadata: { source: 'Copernicus EMS', product: 'Fire Risk', count: raw.features.length, generatedAt: new Date().toISOString() },
    };
  }

  private severity(p: Record<string, unknown>): BurnSeverityType {
    const a = (p.area_ha as number) || 0;
    if (a > 1000) return 'critical';
    if (a > 500) return 'high';
    if (a > 100) return 'medium';
    return 'low';
  }

  private riskLevel(i: number | undefined): RiskLevelType {
    if (!i) return 'faible';
    if (i > 0.8) return 'extrême';
    if (i > 0.6) return 'élevé';
    if (i > 0.4) return 'modéré';
    return 'faible';
  }

  private emptyBurned(): BurnedAreaCollection {
    return { type: 'FeatureCollection', features: [], metadata: { source: 'Copernicus EMS', product: 'Burned Areas', count: 0, generatedAt: new Date().toISOString() } };
  }

  private emptyRisk(): FireRiskCollection {
    return { type: 'FeatureCollection', features: [], metadata: { source: 'Copernicus EMS', product: 'Fire Risk', count: 0, generatedAt: new Date().toISOString() } };
  }
}

export default new CopernicusService();
