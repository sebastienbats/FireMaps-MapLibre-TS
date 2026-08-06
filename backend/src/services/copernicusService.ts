import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type {
  BurnedAreaCollection, FireRiskCollection, BoundingBox,
  BurnSeverityType, RiskLevelType,
} from '../types';

const cache = new NodeCache({ stdTTL: 3600 });

// ✅ EFFIS (European Forest Fire Information System) — JRC European Commission
// Source réelle et accessible pour les données de risque incendie en Europe
const EFFIS_BASE_URL = 'https://effis.jrc.ec.europa.eu';

// ✅ NASA FIRMS Burned Area (MCD64A1) — produit mensuel de zones brûlées
const FIRMS_BURNED_URL = 'https://firms.modaps.eosdis.nasa.gov/api/burned/csv';

class CopernicusService {
  /**
   * Zones brûlées — via NASA FIRMS Burned Area (MCD64A1)
   * ✅ Source réelle : https://firms.modaps.eosdis.nasa.gov/api/
   * Note : produit mensuel, pas temps réel
   */
  async getBurnedAreas(bbox: BoundingBox | null = null): Promise<BurnedAreaCollection> {
    const cacheKey = `burned_${JSON.stringify(bbox)}`;
    const cached = cache.get<BurnedAreaCollection>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.FIRMS_API_KEY;
    if (!apiKey) {
      logger.warn('[BurnedAreas] Clé FIRMS manquante, retour vide');
      return this.emptyBurned();
    }

    try {
      // ✅ URL réelle FIRMS Burned Area
      // Format : /api/burned/csv/{KEY}/{COUNTRY}/{YEAR}/{MONTH}
      const now = new Date();
      // MCD64A1 a un délai de ~2 mois, on prend le mois M-2
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');

      const url = `${FIRMS_BURNED_URL}/${apiKey}/FRA/${year}/${month}`;

      const res = await axios.get<string>(url, {
        timeout: 60_000,
        headers: {
          'User-Agent': 'FireMaps/4.1',
          'Accept': 'text/csv',
          // ✅ Pas de header Authorization pour FIRMS
        },
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
      logger.warn(`[BurnedAreas] ${msg} — retour vide`);
      return this.emptyBurned();
    }
  }

  /**
   * Risque incendie — via EFFIS Fire Weather Index
   * ✅ Source réelle : https://effis.jrc.ec.europa.eu/
   * Note : EFFIS publie des indices FWI pour l'Europe
   */
  async getFireRisk(): Promise<FireRiskCollection> {
    const cached = cache.get<FireRiskCollection>('fire_risk');
    if (cached) return cached;

    try {
      // ✅ EFFIS fournit les données FWI via leur service web
      // On utilise l'endpoint public de données statiques EFFIS
      const res = await axios.get(`${EFFIS_BASE_URL}/static/public/data/public/fwi_current.json`, {
        timeout: 30_000,
        headers: { 'User-Agent': 'FireMaps/4.1', 'Accept': 'application/json' },
      });

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
      logger.info(`[FireRisk] ${features.length} zones à risque (EFFIS)`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.warn(`[FireRisk] ${msg} — retour vide`);
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

    if (latIdx === -1 || lonIdx === -1) return [];

    const features: BurnedAreaCollection['features'] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
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
      const burnDate = dateIdx !== -1 ? cols[dateIdx] : null;

      // Créer un petit polygone autour du point (approximation)
      const delta = Math.sqrt(areaHa / 100) * 0.01 || 0.005;
      const polygon = [
        [
          [lon - delta, lat - delta],
          [lon + delta, lat - delta],
          [lon + delta, lat + delta],
          [lon - delta, lat + delta],
          [lon - delta, lat - delta],
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
   */
  private parseEffisRisk(data: unknown): FireRiskCollection['features'] {
    // EFFIS peut retourner différents formats selon l'endpoint
    // On gère le cas d'un tableau de points avec indice FWI
    const raw = data as Array<{ lat?: number; lon?: number; fwi?: number; [k: string]: unknown }> | Record<string, unknown>;

    if (Array.isArray(raw)) {
      return raw
        .filter(p => p.lat !== undefined && p.lon !== undefined)
        .map(p => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [p.lon! - 0.1, p.lat! - 0.1],
              [p.lon! + 0.1, p.lat! - 0.1],
              [p.lon! + 0.1, p.lat! + 0.1],
              [p.lon! - 0.1, p.lat! + 0.1],
              [p.lon! - 0.1, p.lat! - 0.1],
            ]],
          },
          properties: {
            riskLevel: this.riskFromFwi(p.fwi || 0),
            risk_index: p.fwi || 0,
            product: 'Fire Risk' as const,
            source: 'EFFIS (JRC)' as const,
          },
        }));
    }

    // Si le format n'est pas un tableau, retourner vide
    logger.warn('[FireRisk] Format EFFIS inattendu, retour vide');
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
