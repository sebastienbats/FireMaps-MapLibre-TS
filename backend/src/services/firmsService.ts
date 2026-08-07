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
const TIMEOUT_MS = 30_000;

const FRANCE_BBOX = '-5.5,41.0,10.0,51.5';
const FIRMS_AREA_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

// ✅ Noms exacts des sources FIRMS (documentés officiellement)
const FIRMS_SOURCES = {
  VIIRS: 'VIIRS_SNPP_NRT',
  MODIS: 'MODIS_C61',  // ✅ MODIS Collection 6.1 (MODIS_T ne fonctionne plus)
} as const;

class FirmsService {
  async getFireData(days: number = 1): Promise<FireCollection> {
    const safeDays = Math.min(Math.max(days, 1), 5);
    const cacheKey = `firms_${safeDays}days`;
    const cached = cache.get<FireCollection>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.FIRMS_API_KEY;
    if (!apiKey) throw new Error('Clé API NASA FIRMS manquante');

    try {
      const [viirs, modis] = await Promise.all([
        this.fetchSensor(apiKey, 'VIIRS', FIRMS_SOURCES.VIIRS, safeDays),
        this.fetchSensor(apiKey, 'MODIS', FIRMS_SOURCES.MODIS, safeDays),
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
      logger.info(`[FIRMS] ${features.length} feux sur ${safeDays}j (VIIRS:${viirs.length} MODIS:${modis.length})`);
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
    source: string,
    days: number
  ): Promise<FireFeature[]> {
    const url = `${FIRMS_AREA_URL}/${key}/${source}/${FRANCE_BBOX}/${days}`;

    try {
      const res = await axios.get<string>(url, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'FireMaps/4.2',
          'Accept': 'text/csv',
        },
      });

      if (!res.data || res.data.trim() === '') {
        logger.info(`[FIRMS] ${sensor}: aucun feu détecté sur ${days}j`);
        return [];
      }

      if (!res.data.includes(',')) {
        logger.warn(`[FIRMS] ${sensor}: réponse inattendue — ${res.data.substring(0, 100)}`);
        return [];
      }

      const records: FirmsCsvRecord[] = parse(res.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      return records
        .filter(r => r.latitude && r.longitude && !isNaN(parseFloat(r.latitude)))
        .map(r => this.toFeature(r, sensor));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const msg = typeof data === 'string' ? data.substring(0, 200) : error.message;
        logger.warn(`[FIRMS] ${sensor}: HTTP ${status} — ${msg}`);
      } else {
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.warn(`[FIRMS] ${sensor}: ${msg}`);
      }
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
      instrument: (r.instrument as FireSensorType) || sensor,
      daynight: (r.daynight as DayNightType) || 'D',
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
