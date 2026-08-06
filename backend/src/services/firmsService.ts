import axios from 'axios';
import { parse } from 'csv-parse/sync';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type {
  FireCollection, FireFeature, FireProperties,
  FireIntensityType, FireIntensityClassType,
  FireSensorType, FirmsCsvRecord, DayNightType,
} from '../types';

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || '300', 10) });
const FIRMS_API_URL = 'https://firms.modaps.eosdis.nasa.gov/api/country/csv';
const COUNTRY_CODE = 'FRA';
const TIMEOUT_MS = 30_000;

class FirmsService {
  async getFireData(days: number = 1): Promise<FireCollection> {
    const cacheKey = `firms_${days}days`;
    const cached = cache.get<FireCollection>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.FIRMS_API_KEY;
    if (!apiKey) throw new Error('Clé API NASA FIRMS manquante');

    try {
      const [viirs, modis] = await Promise.all([
        this.fetchSensor(apiKey, 'VIIRS', days),
        this.fetchSensor(apiKey, 'MODIS', days),
      ]);

      const features = this.dedupe([...viirs, ...modis]);

      const result: FireCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'NASA FIRMS',
          sensors: ['VIIRS', 'MODIS'],
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set(cacheKey, result);
      logger.info(`[FIRMS] ${features.length} feux (VIIRS:${viirs.length} MODIS:${modis.length})`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(`[FIRMS] ${msg}`);
      throw error;
    }
  }

  private async fetchSensor(
    key: string,
    sensor: FireSensorType,
    days: number
  ): Promise<FireFeature[]> {
    // ✅ URL : https://firms.modaps.eosdis.nasa.gov/api/country/csv/{KEY}/{COUNTRY}/{DAYS}
    // ✅ La clé API est dans l'URL, PAS en header Authorization
    const url = `${FIRMS_API_URL}/${key}/${COUNTRY_CODE}/${days}`;

    try {
      const res = await axios.get<string>(url, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'FireMaps/4.1',
          'Accept': 'text/csv',
          // ✅ PAS de header Authorization pour FIRMS
          // La clé est déjà dans l'URL
        },
      });

      const records: FirmsCsvRecord[] = parse(res.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records
        .filter(r => r.latitude && r.longitude)
        .map(r => this.toFeature(r, sensor));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[FIRMS] Erreur ${sensor}: ${msg}`);
      return [];
    }
  }

  private toFeature(r: FirmsCsvRecord, sensor: FireSensorType): FireFeature {
    const frp = parseFloat(r.frp) || 0;

    const props: FireProperties = {
      brightness: parseFloat(r.brightness) || 0,
      frp,
      confidence: parseInt(r.confidence, 10) || 0,
      acq_date: r.acq_date || null,
      acq_time: r.acq_time || null,
      satellite: r.satellite || 'unknown',
      instrument: sensor,
      daynight: (r.daynight || 'D') as DayNightType,
      intensity: this.intensity(frp),
      intensityClass: this.intensityClass(frp),
      source: 'NASA FIRMS',
    };

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
      },
      properties: props,
    };
  }

  private dedupe(features: FireFeature[]): FireFeature[] {
    const seen = new Set<string>();
    return features.filter(f => {
      const [lon, lat] = f.geometry.coordinates;
      const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private intensity(frp: number): FireIntensityType {
    if (frp > 100) return 'Extrême';
    if (frp > 50) return 'Élevée';
    if (frp > 20) return 'Modérée';
    return 'Faible';
  }

  private intensityClass(frp: number): FireIntensityClassType {
    if (frp > 100) return 'extreme';
    if (frp > 50) return 'high';
    if (frp > 20) return 'medium';
    return 'low';
  }
}

export default new FirmsService();
