import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type {
  BurnedAreaCollection, FireRiskCollection, BoundingBox,
  BurnSeverityType, RiskLevelType, Position,
} from '../types';

const cache = new NodeCache({ stdTTL: 3600 });

const FIRMS_BURNED_URL = 'https://firms.modaps.eosdis.nasa.gov/api/burned/csv';
const EFFIS_BASE_URL = 'https://effis.jrc.ec.europa.eu';

class CopernicusService {
  async getBurnedAreas(bbox: BoundingBox | null = null): Promise<BurnedAreaCollection> {
    const cacheKey = `burned_${JSON.stringify(bbox)}`;
    const cached = cache.get<BurnedAreaCollection>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.FIRMS_API_KEY;
    if (!apiKey) {
      logger.warn('[BurnedAreas] Clé FIRMS manquante');
      return this.emptyBurned();
    }

    try {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');

      const url = `${FIRMS_BURNED_URL}/${apiKey}/FRA/${year}/${month}`;

      const res = await axios.get<string>(url, {
        timeout: 60_000,
        headers: { 'User-Agent': 'FireMaps/4.2', 'Accept': 'text/csv' },
      });

      const features = this.parseBurnedCsv(res.data, bbox);

      const result: BurnedAreaCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'NASA FIRMS (MCD64A1)',
          product: 'Burned Areas',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set(cacheKey, result);
      logger.info(`[BurnedAreas] ${features.length} zones brûlées (${year}-${month})`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[BurnedAreas] ${msg}`);
      return this.emptyBurned();
    }
  }

  async getFireRisk(): Promise<FireRiskCollection> {
    const cached = cache.get<FireRiskCollection>('fire_risk');
    if (cached) return cached;

    try {
      const res = await axios.get(
        `${EFFIS_BASE_URL}/static/public/data/public/fwi_current.json`,
        {
          timeout: 30_000,
          headers: { 'User-Agent': 'FireMaps/4.2', 'Accept': 'application/json' },
        }
      );

      const features = this.parseEffisRisk(res.data);

      const result: FireRiskCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'EFFIS (JRC)',
          product: 'Fire Risk',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set('fire_risk', result);
      logger.info(`[FireRisk] ${features.length} zones à risque`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[FireRisk] ${msg}`);
      return this.emptyRisk();
    }
  }

  private parseBurnedCsv(
    csv: string,
    bbox: BoundingBox | null
  ): BurnedAreaCollection['features'] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const latIdx = headers.indexOf('latitude');
    const lonIdx = headers.indexOf('longitude');
    const areaIdx = headers.indexOf('area_ha');
    const dateIdx = headers.indexOf('burn_date');

    if (latIdx === -1 || lonIdx === -1) return [];

    const features: BurnedAreaCollection['features'] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);

      if (isNaN(lat) || isNaN(lon)) continue;

      if (bbox) {
        if (lon < bbox.minLon || lon > bbox.maxLon || lat < bbox.minLat || lat > bbox.maxLat) {
          continue;
        }
      }

      const areaHa = areaIdx !== -1 ? parseFloat(cols[areaIdx]) || 0 : 0;
      const burnDate = dateIdx !== -1 ? cols[dateIdx] : undefined;

      const delta = Math.sqrt(areaHa / 100) * 0.01 || 0.005;

      // ✅ Typage explicite des coordonnées du polygone
      const polygon: Position[][] = [
        [
          [lon - delta, lat - delta] as Position,
          [lon + delta, lat - delta] as Position,
          [lon + delta, lat + delta] as Position,
          [lon - delta, lat + delta] as Position,
          [lon - delta, lat - delta] as Position,
        ],
      ];

      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: polygon },
        properties: {
          severity: this.severityFromArea(areaHa),
          area_ha: areaHa,
          acquisition_date: burnDate,
          product: 'Burned Areas',
          source: 'NASA FIRMS (MCD64A1)',
        },
      });
    }

    return features;
  }

  private parseEffisRisk(data: unknown): FireRiskCollection['features'] {
    const raw = data as Array<{ lat?: number; lon?: number; fwi?: number }> | Record<string, unknown>;

    if (Array.isArray(raw)) {
      return raw
        .filter(p => p.lat !== undefined && p.lon !== undefined)
        .map(p => {
          // ✅ Typage explicite des coordonnées du polygone
          const polygon: Position[][] = [
            [
              [p.lon! - 0.1, p.lat! - 0.1] as Position,
              [p.lon! + 0.1, p.lat! - 0.1] as Position,
              [p.lon! + 0.1, p.lat! + 0.1] as Position,
              [p.lon! - 0.1, p.lat! + 0.1] as Position,
              [p.lon! - 0.1, p.lat! - 0.1] as Position,
            ],
          ];

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: polygon,
            },
            properties: {
              riskLevel: this.riskFromFwi(p.fwi || 0),
              risk_index: p.fwi || 0,
              product: 'Fire Risk' as const,
              source: 'EFFIS (JRC)',
            },
          };
        });
    }

    return [];
  }

  private severityFromArea(areaHa: number): BurnSeverityType {
    if (areaHa > 1000) return 'critical';
    if (areaHa > 500) return 'high';
    if (areaHa > 100) return 'medium';
    return 'low';
  }

  private riskFromFwi(fwi: number): RiskLevelType {
    if (fwi > 50) return 'extrême';
    if (fwi > 30) return 'élevé';
    if (fwi > 15) return 'modéré';
    return 'faible';
  }

  private emptyBurned(): BurnedAreaCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'NASA FIRMS (MCD64A1)',
        product: 'Burned Areas',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private emptyRisk(): FireRiskCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'EFFIS (JRC)',
        product: 'Fire Risk',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export default new CopernicusService();
