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

// ✅ Bounding box de la France métropolitaine
const FRANCE_BBOX = '-5.5,41.0,10.0,51.5';

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
    // ✅ URL format AREA (plus fiable que COUNTRY pour la France)
    // Format : /api/area/csv/{KEY}/{AREA}/{DAYS}
    // AREA = "min_lon,min_lat,max_lon,max_lat"
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${FRANCE_BBOX}/${days}`;

    try {
      const res = await axios.get<string>(url, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'FireMaps/4.2',
          'Accept': 'text/csv',
        },
      });

      if (!res.data || res.data.trim() === '') {
        logger.warn(`[FIRMS] Réponse vide pour ${sensor}`);
        return [];
      }

      const records: FirmsCsvRecord[] = parse(res.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Filtrer par capteur si la colonne instrument existe
      const filtered = records.filter(r => {
        if (!r.latitude || !r.longitude) return false;
        // Si la colonne instrument existe, filtrer par capteur
        if (r.instrument) {
          return r.instrument.toUpperCase().includes(sensor);
        }
        return true;
      });

      return filtered.map(r => this.toFeature(r, sensor));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        logger.warn(`[FIRMS] Erreur ${sensor}: HTTP ${status} — ${typeof data === 'string' ? data.substring(0, 200) : error.message}`);
      } else {
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.warn(`[FIRMS] Erreur ${sensor}: ${msg}`);
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
      instrument: (r.instrument || sensor) as FireSensorType,
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
