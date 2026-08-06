import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { SdisCollection, SdisFeature, SdisTypeValue } from '../types';

const cache = new NodeCache({ stdTTL: 86_400 });
const API = 'https://geo.api.gouv.fr/sdis';

class SdisService {
  async getAll(): Promise<SdisCollection> {
    const cached = cache.get<SdisCollection>('sdis_all');
    if (cached) return cached;

    try {
      const res = await axios.get(API, { params: { format: 'geojson' }, timeout: 30_000 });
      const result = this.map(res.data);
      cache.set('sdis_all', result);
      logger.info(`[SDIS] ${result.features.length} casernes`);
      return result;
    } catch (e) {
      logger.warn(`[SDIS] ${e instanceof Error ? e.message : e}`);
      return this.empty();
    }
  }

  private map(data: unknown): SdisCollection {
    const raw = data as { features?: Array<{ geometry: unknown; properties: Record<string, unknown> }> };
    if (!raw?.features) return this.empty();
    return {
      type: 'FeatureCollection',
      features: raw.features.map((f): SdisFeature => ({
        type: 'Feature',
        geometry: f.geometry as SdisFeature['geometry'],
        properties: {
          name: (f.properties.nom as string) || (f.properties.name as string) || 'N/A',
          department: (f.properties.departement as string) || (f.properties.department as string) || '',
          type: ((f.properties.type as string) || 'principal') as SdisTypeValue,
          capacity: (f.properties.capacite as string) || 'N/A',
          contact: (f.properties.contact as string) || 'N/A',
          source: 'SDIS',
        },
      })),
      metadata: { source: 'SDIS', count: raw.features.length, generatedAt: new Date().toISOString() },
    };
  }

  private empty(): SdisCollection {
    return { type: 'FeatureCollection', features: [], metadata: { source: 'SDIS', count: 0, generatedAt: new Date().toISOString() } };
  }
}

export default new SdisService();
