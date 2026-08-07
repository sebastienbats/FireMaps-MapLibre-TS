import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type {
  BurnedAreaCollection, FireRiskCollection, BoundingBox,
  BurnSeverityType, RiskLevelType, Position,
} from '../types';

const cache = new NodeCache({ stdTTL: 3600 });

// ✅ NASA FIRMS API pour les zones brûlées
// Source : BA_MODIS (MODIS Burned Areas) ou BA_VIIRS (VIIRS Burned Areas)
// Documentation : https://firms.modaps.eosdis.nasa.gov/api/data_availability/
const FIRMS_AREA_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/meteofrance';

const FRANCE_GRID: Array<{ lat: number; lon: number; name: string }> = [
  { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  { lat: 43.2965, lon: 5.3698, name: 'Marseille' },
  { lat: 45.7640, lon: 4.8357, name: 'Lyon' },
  { lat: 44.8378, lon: -0.5792, name: 'Bordeaux' },
  { lat: 43.6047, lon: 1.4442, name: 'Toulouse' },
  { lat: 42.6987, lon: 2.8956, name: 'Perpignan' },
  { lat: 43.6108, lon: 3.8767, name: 'Montpellier' },
  { lat: 44.1000, lon: 4.0800, name: 'Nîmes' },
  { lat: 43.5000, lon: 6.4500, name: 'Toulon' },
  { lat: 41.9269, lon: 8.7360, name: 'Ajaccio' },
];

// ✅ Bounding box de la France (west,south,east,north)
const FRANCE_BBOX = '-5.5,41.0,10.0,51.5';

class CopernicusService {
  /**
   * Zones brûlées — NASA FIRMS BA_MODIS (MODIS Burned Areas)
   * ✅ Format : /api/area/csv/{KEY}/BA_MODIS/{AREA}/{DAYS}
   * DAYS doit être entre 1 et 5
   */
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
      // ✅ Utiliser BA_MODIS comme source pour les zones brûlées
      // Format identique aux feux actifs : /api/area/csv/{KEY}/{SOURCE}/{AREA}/{DAYS}
      const url = `${FIRMS_AREA_URL}/${apiKey}/BA_MODIS/${FRANCE_BBOX}/5`;

      const res = await axios.get<string>(url, {
        timeout: 60_000,
        headers: {
          'User-Agent': 'FireMaps/4.2',
          'Accept': 'text/csv',
        },
      });

      if (!res.data || res.data.trim() === '') {
        logger.info('[BurnedAreas] Aucune zone brûlée sur les 5 derniers jours');
        return this.emptyBurned();
      }

      if (!res.data.includes(',')) {
        logger.warn(`[BurnedAreas] Réponse inattendue: ${res.data.substring(0, 100)}`);
        return this.emptyBurned();
      }

      const features = this.parseBurnedCsv(res.data, bbox);

      const result: BurnedAreaCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'NASA FIRMS (BA_MODIS)',
          product: 'Burned Areas',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set(cacheKey, result);
      logger.info(`[BurnedAreas] ${features.length} zones brûlées`);
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const msg = typeof data === 'string' ? data.substring(0, 200) : error.message;
        logger.warn(`[BurnedAreas] HTTP ${status}: ${msg}`);
      } else {
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.warn(`[BurnedAreas] ${msg}`);
      }
      return this.emptyBurned();
    }
  }

  async getFireRisk(): Promise<FireRiskCollection> {
    const cached = cache.get<FireRiskCollection>('fire_risk');
    if (cached) return cached;

    try {
      const requests = FRANCE_GRID.map(point =>
        axios.get(OPEN_METEO_URL, {
          params: {
            latitude: point.lat,
            longitude: point.lon,
            hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
            wind_speed_unit: 'kmh',
            timezone: 'Europe/Paris',
            forecast_days: 1,
          },
          timeout: 10_000,
        })
          .then(res => this.calculateFwi(res.data, point.lon, point.lat, point.name))
          .catch(err => {
            logger.warn(`[FireRisk] Erreur ${point.name}: ${err.message}`);
            return null;
          })
      );

      const results = await Promise.allSettled(requests);
      const features: FireRiskCollection['features'] = results
        .filter((r): r is PromiseFulfilledResult<FireRiskCollection['features'][0] | null> =>
          r.status === 'fulfilled')
        .map(r => r.value)
        .filter((f): f is FireRiskCollection['features'][0] => f !== null);

      const result: FireRiskCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'FWI calculé (Open-Meteo)',
          product: 'Fire Risk',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set('fire_risk', result);
      logger.info(`[FireRisk] ${features.length} zones FWI calculées`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[FireRisk] ${msg}`);
      return this.emptyRisk();
    }
  }

  private calculateFwi(
    data: {
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        relative_humidity_2m?: number[];
        wind_speed_10m?: number[];
        precipitation?: number[];
      };
    },
    lon: number,
    lat: number,
    name: string
  ): FireRiskCollection['features'][0] | null {
    const hourly = data.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) return null;

    const temps = hourly.temperature_2m || [];
    const humids = hourly.relative_humidity_2m || [];
    const winds = hourly.wind_speed_10m || [];
    const precip = hourly.precipitation || [];

    if (temps.length === 0) return null;

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgHumid = humids.reduce((a, b) => a + b, 0) / humids.length;
    const avgWind = winds.reduce((a, b) => a + b, 0) / winds.length;
    const totalPrecip = precip.reduce((a, b) => a + b, 0);

    const tempScore = Math.min(Math.max((avgTemp - 15) * 2, 0), 30);
    const humidScore = Math.min(Math.max((70 - avgHumid) * 0.8, 0), 40);
    const windScore = Math.min(avgWind * 0.5, 25);
    const precipPenalty = Math.min(totalPrecip * 5, 30);

    const fwi = Math.max(0, Math.min(100,
      tempScore + humidScore + windScore - precipPenalty
    ));

    const delta = 0.3;
    const polygon: Position[][] = [
      [
        [lon - delta, lat - delta] as Position,
        [lon + delta, lat - delta] as Position,
        [lon + delta, lat + delta] as Position,
        [lon - delta, lat + delta] as Position,
        [lon - delta, lat - delta] as Position,
      ],
    ];

    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: polygon },
      properties: {
        riskLevel: this.riskFromFwi(fwi),
        risk_index: Math.round(fwi),
        product: 'Fire Risk',
        source: 'FWI calculé (Open-Meteo)',
        _debug: {
          name,
          avgTemp: Math.round(avgTemp * 10) / 10,
          avgHumid: Math.round(avgHumid),
          avgWind: Math.round(avgWind * 10) / 10,
          totalPrecip: Math.round(totalPrecip * 10) / 10,
        },
      },
    };
  }

  private parseBurnedCsv(
    csv: string,
    bbox: BoundingBox | null
  ): BurnedAreaCollection['features'] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const latIdx = headers.findIndex(h => h.includes('lat'));
    const lonIdx = headers.findIndex(h => h.includes('lon'));
    const areaIdx = headers.findIndex(h => h.includes('area') || h.includes('burn'));
    const dateIdx = headers.findIndex(h => h.includes('date'));

    if (latIdx === -1 || lonIdx === -1) {
      logger.warn(`[BurnedAreas] Colonnes non trouvées. Headers: ${headers.join(', ')}`);
      return [];
    }

    const features: BurnedAreaCollection['features'] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < Math.max(latIdx, lonIdx) + 1) continue;

      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);

      if (isNaN(lat) || isNaN(lon)) continue;

      if (bbox) {
        if (lon < bbox.minLon || lon > bbox.maxLon || lat < bbox.minLat || lat > bbox.maxLat) {
          continue;
        }
      }

      const areaHa = areaIdx !== -1 ? parseFloat(cols[areaIdx]) || 0 : 0;
      const burnDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : undefined;

      const delta = Math.sqrt(Math.max(areaHa, 1) / 100) * 0.01 || 0.005;

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
          source: 'NASA FIRMS (BA_MODIS)',
        },
      });
    }

    return features;
  }

  private severityFromArea(areaHa: number): BurnSeverityType {
    if (areaHa > 1000) return 'critical';
    if (areaHa > 500) return 'high';
    if (areaHa > 100) return 'medium';
    return 'low';
  }

  private riskFromFwi(fwi: number): RiskLevelType {
    if (fwi > 60) return 'extrême';
    if (fwi > 40) return 'élevé';
    if (fwi > 20) return 'modéré';
    return 'faible';
  }

  private emptyBurned(): BurnedAreaCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'NASA FIRMS (BA_MODIS)',
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
        source: 'FWI calculé (Open-Meteo)',
        product: 'Fire Risk',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export default new CopernicusService();
