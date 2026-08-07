import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type {
  BurnedAreaCollection, FireRiskCollection, BoundingBox,
  BurnSeverityType, RiskLevelType, Position,
} from '../types';

const cache = new NodeCache({ stdTTL: 3600 });

// ✅ Bounding box de la France métropolitaine
const FRANCE_BBOX = '-5.5,41.0,10.0,51.5';

// ✅ URLs EFFIS (plusieurs endpoints testés en cascade)
const EFFIS_URLS = [
  'https://effis.jrc.ec.europa.eu/static/public/data/public/fwi_current.json',
  'https://effis.jrc.ec.europa.eu/api/v1/fwi/current',
  'https://cidportal.jrc.ec.europa.eu/ftp/jrc-opendata/EFFIS/fwi/current.json',
];

class CopernicusService {
  /**
   * Zones brûlées — NASA FIRMS MCD64A1
   * ✅ Format AREA (plus fiable que COUNTRY pour la France)
   * URL : /api/burned/area/csv/{KEY}/{AREA}/{YEAR}/{MONTH}
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
      // MCD64A1 a un délai de ~2 mois, on prend le mois M-2
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');

      // ✅ Format AREA au lieu de COUNTRY
      const url = `https://firms.modaps.eosdis.nasa.gov/api/burned/area/csv/${apiKey}/${FRANCE_BBOX}/${year}/${month}`;

      const res = await axios.get<string>(url, {
        timeout: 60_000,
        headers: {
          'User-Agent': 'FireMaps/4.2',
          'Accept': 'text/csv',
        },
      });

      if (!res.data || res.data.trim() === '') {
        logger.warn('[BurnedAreas] Réponse vide');
        return this.emptyBurned();
      }

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

  /**
   * Risque incendie — EFFIS Fire Weather Index
   * ✅ Teste plusieurs URLs EFFIS en cascade (fallback)
   */
  async getFireRisk(): Promise<FireRiskCollection> {
    const cached = cache.get<FireRiskCollection>('fire_risk');
    if (cached) return cached;

    let data: unknown = null;
    let successUrl = '';

    // ✅ Tester chaque URL EFFIS jusqu'à trouver une réponse valide
    for (const url of EFFIS_URLS) {
      try {
        const res = await axios.get(url, {
          timeout: 15_000,
          headers: {
            'User-Agent': 'FireMaps/4.2',
            'Accept': 'application/json',
          },
        });

        if (res.data) {
          data = res.data;
          successUrl = url;
          break;
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          logger.warn(`[FireRisk] Échec ${url}: HTTP ${err.response?.status}`);
        } else {
          logger.warn(`[FireRisk] Échec ${url}: ${err instanceof Error ? err.message : 'Erreur'}`);
        }
      }
    }

    if (!data) {
      logger.warn('[FireRisk] Aucune source EFFIS disponible, retour vide');
      return this.emptyRisk();
    }

    try {
      const features = this.parseEffisRisk(data);

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
      logger.info(`[FireRisk] ${features.length} zones à risque (depuis ${successUrl})`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[FireRisk] Erreur parsing: ${msg}`);
      return this.emptyRisk();
    }
  }

  /**
   * Parse le CSV FIRMS Burned Area en GeoJSON
   */
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

    if (latIdx === -1 || lonIdx === -1) {
      logger.warn('[BurnedAreas] Colonnes latitude/longitude non trouvées dans le CSV');
      return [];
    }

    const features: BurnedAreaCollection['features'] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < Math.max(latIdx, lonIdx) + 1) continue;

      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);

      if (isNaN(lat) || isNaN(lon)) continue;

      // Filtre bbox si fourni
      if (bbox) {
        if (lon < bbox.minLon || lon > bbox.maxLon || lat < bbox.minLat || lat > bbox.maxLat) {
          continue;
        }
      }

      const areaHa = areaIdx !== -1 ? parseFloat(cols[areaIdx]) || 0 : 0;
      const burnDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : undefined;

      // Créer un petit polygone autour du point (approximation)
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

  /**
   * Parse les données EFFIS FWI en GeoJSON
   * Gère plusieurs formats possibles (tableau de points ou objet)
   */
  private parseEffisRisk(data: unknown): FireRiskCollection['features'] {
    // Cas 1 : Tableau de points avec lat/lon/fwi
    if (Array.isArray(data)) {
      return data
        .filter((p): p is { lat: number; lon: number; fwi?: number } =>
          typeof p === 'object' && p !== null &&
          typeof (p as Record<string, unknown>).lat === 'number' &&
          typeof (p as Record<string, unknown>).lon === 'number'
        )
        .map(p => {
          const delta = 0.1;
          const polygon: Position[][] = [
            [
              [p.lon - delta, p.lat - delta] as Position,
              [p.lon + delta, p.lat - delta] as Position,
              [p.lon + delta, p.lat + delta] as Position,
              [p.lon - delta, p.lat + delta] as Position,
              [p.lon - delta, p.lat - delta] as Position,
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

    // Cas 2 : Objet avec une clé "features" ou "data"
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // Sous-cas 2a : { features: [...] }
      if (Array.isArray(obj.features)) {
        return this.parseEffisRisk(obj.features);
      }

      // Sous-cas 2b : { data: [...] }
      if (Array.isArray(obj.data)) {
        return this.parseEffisRisk(obj.data);
      }

      // Sous-cas 2c : { fwi: [...], lat: [...], lon: [...] }
      if (Array.isArray(obj.fwi) && Array.isArray(obj.lat) && Array.isArray(obj.lon)) {
        const fwiArr = obj.fwi as number[];
        const latArr = obj.lat as number[];
        const lonArr = obj.lon as number[];
        const points = latArr.map((lat, i) => ({
          lat,
          lon: lonArr[i],
          fwi: fwiArr[i],
        }));
        return this.parseEffisRisk(points);
      }
    }

    logger.warn('[FireRisk] Format EFFIS non reconnu, retour vide');
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
