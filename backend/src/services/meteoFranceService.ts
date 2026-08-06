import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { WeatherData, WindCollection, MeteoFranceToken } from '../types';

const cache = new NodeCache({ stdTTL: 600 });
const API = 'https://api.meteo-france.com/v1';

class MeteoFranceService {
  async getWindData(): Promise<WindCollection> {
    const cached = cache.get<WindCollection>('meteo_wind');
    if (cached) return cached;

    const key = process.env.METEO_FRANCE_API_KEY;
    const secret = process.env.METEO_FRANCE_API_SECRET;
    if (!key || !secret) return this.emptyWind();

    try {
      const token = await this.token(key, secret);
      const res = await axios.get(`${API}/wind`, {
        params: { token, domain: 'france', format: 'json' },
        timeout: 30_000,
      });
      const result = this.mapWind(res.data);
      cache.set('meteo_wind', result);
      logger.info(`[Météo-France] ${result.features.length} points vent`);
      return result;
    } catch (e) {
      logger.error(`[Météo-France] ${e instanceof Error ? e.message : e}`);
      return this.emptyWind();
    }
  }

  private async token(key: string, secret: string): Promise<string> {
    const res = await axios.post<MeteoFranceToken>(
      'https://api.meteo-france.com/oauth/token',
      { grant_type: 'client_credentials', client_id: key, client_secret: secret },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data.access_token;
  }

  private mapWind(data: Record<string, unknown>): WindCollection {
    const pts = (data.points as Array<{ lon: number; lat: number; wind_speed: number; wind_direction: number; wind_gust?: number }>) || [];
    return {
      type: 'FeatureCollection',
      features: pts.map(p => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] as [number, number] },
        properties: { speed: p.wind_speed, direction: p.wind_direction, gust: p.wind_gust, source: 'Météo-France' as const },
      })),
      metadata: { source: 'Météo-France', count: pts.length, generatedAt: new Date().toISOString() },
    };
  }

  private emptyWind(): WindCollection {
    return { type: 'FeatureCollection', features: [], metadata: { source: 'Météo-France', count: 0, generatedAt: new Date().toISOString() } };
  }
}

export default new MeteoFranceService();
