import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { SdisCollection, SdisFeature, SdisTypeValue } from '../types';

const cache = new NodeCache({ stdTTL: 86_400 });

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

// ✅ Données de fallback : principales casernes SDIS de France
// Utilisées si Overpass timeout ou échoue
const FALLBACK_SDIS: Array<{ lat: number; lon: number; name: string; dept: string }> = [
  { lat: 48.8566, lon: 2.3522, name: 'BSPP (Paris)', dept: '75' },
  { lat: 43.2965, lon: 5.3698, name: 'SDIS 13 (Marseille)', dept: '13' },
  { lat: 45.7640, lon: 4.8357, name: 'SDIS 69 (Lyon)', dept: '69' },
  { lat: 44.8378, lon: -0.5792, name: 'SDIS 33 (Bordeaux)', dept: '33' },
  { lat: 43.6047, lon: 1.4442, name: 'SDIS 31 (Toulouse)', dept: '31' },
  { lat: 47.2184, lon: -1.5536, name: 'SDIS 44 (Nantes)', dept: '44' },
  { lat: 48.5734, lon: 7.7521, name: 'SDIS 67 (Strasbourg)', dept: '67' },
  { lat: 45.1885, lon: 5.7245, name: 'SDIS 38 (Grenoble)', dept: '38' },
  { lat: 43.6108, lon: 3.8767, name: 'SDIS 34 (Montpellier)', dept: '34' },
  { lat: 49.4432, lon: 1.0993, name: 'SDIS 76 (Rouen)', dept: '76' },
  { lat: 47.3220, lon: -0.5496, name: 'SDIS 49 (Angers)', dept: '49' },
  { lat: 43.5297, lon: -1.4684, name: 'SDIS 64 (Bayonne)', dept: '64' },
  { lat: 42.6987, lon: 2.8956, name: 'SDIS 66 (Perpignan)', dept: '66' },
  { lat: 41.9269, lon: 8.7360, name: 'SDIS 2A (Ajaccio)', dept: '2A' },
  { lat: 42.7028, lon: 9.4500, name: 'SDIS 2B (Bastia)', dept: '2B' },
  { lat: 45.4397, lon: 4.3913, name: 'SDIS 42 (Saint-Étienne)', dept: '42' },
  { lat: 49.1193, lon: 6.1759, name: 'SDIS 57 (Metz)', dept: '57' },
  { lat: 48.0077, lon: 0.1975, name: 'SDIS 72 (Le Mans)', dept: '72' },
  { lat: 47.0810, lon: 2.3988, name: 'SDIS 18 (Bourges)', dept: '18' },
  { lat: 46.5802, lon: 0.3403, name: 'SDIS 86 (Poitiers)', dept: '86' },
  { lat: 44.5590, lon: 6.0784, name: 'SDIS 05 (Gap)', dept: '05' },
  { lat: 45.8992, lon: 6.1294, name: 'SDIS 74 (Annecy)', dept: '74' },
  { lat: 43.9274, lon: 2.1477, name: 'SDIS 81 (Albi)', dept: '81' },
  { lat: 48.1173, lon: -1.6778, name: 'SDIS 35 (Rennes)', dept: '35' },
  { lat: 46.3235, lon: -0.4579, name: 'SDIS 79 (Niort)', dept: '79' },
];

class SdisService {
  async getAll(): Promise<SdisCollection> {
    const cached = cache.get<SdisCollection>('sdis_all');
    if (cached) return cached;

    // ✅ Requête Overpass optimisée : limite le nombre de résultats
    // et utilise un timeout plus court pour ne pas bloquer l'app
    const servers = [OVERPASS_URL, OVERPASS_MIRROR];

    for (const server of servers) {
      try {
        const result = await this.fetchFromOverpass(server);
        if (result.features.length > 0) {
          cache.set('sdis_all', result);
          logger.info(`[SDIS] ${result.features.length} casernes depuis OSM`);
          return result;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.warn(`[SDIS] Erreur ${server}: ${msg}`);
      }
    }

    // ✅ Fallback : utiliser les données locales si Overpass échoue
    logger.warn('[SDIS] Overpass échoué, utilisation des données de fallback');
    const fallback = this.getFallbackData();
    cache.set('sdis_all', fallback);
    return fallback;
  }

  private async fetchFromOverpass(serverUrl: string): Promise<SdisCollection> {
    // ✅ Requête optimisée :
    // - Limite à 2000 résultats maximum
    // - Timeout réduit à 45s (au lieu de 90s)
    // - Exclut les relations (très lourdes)
    const query = `
      [out:json][timeout:45][maxsize:536870912];
      area["ISO3166-1"="FR"]->.france;
      (
        node["amenity"="fire_station"](area.france);
        way["amenity"="fire_station"](area.france);
      );
      out center tags 2000;
    `;

    const res = await axios.post(
      serverUrl,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FireMaps/4.2',
        },
        timeout: 50_000, // 50s max
      }
    );

    const elements = (res.data.elements || []) as Array<{
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;

    const features: SdisFeature[] = elements
      .filter(el => el.lat !== undefined || el.center !== undefined)
      .map(el => this.toFeature(el));

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        source: 'OpenStreetMap (Overpass)',
        count: features.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private toFeature(el: {
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }): SdisFeature {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lon = el.lon ?? el.center?.lon ?? 0;
    const tags = el.tags || {};

    const type: SdisTypeValue =
      tags.fire_station === 'wildfire' ? 'secondaire' : 'principal';

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        name: tags.name || tags.operator || 'Caserne de pompiers',
        department: tags['addr:department'] || tags['addr:state'] || '',
        type,
        capacity: tags.capacity || 'N/A',
        contact: tags.phone || tags['contact:phone'] || 'N/A',
        source: 'OpenStreetMap',
      },
    };
  }

  /**
   * ✅ Données de fallback : 25 casernes principales de France
   * Utilisées si Overpass API est indisponible ou timeout
   */
  private getFallbackData(): SdisCollection {
    const features: SdisFeature[] = FALLBACK_SDIS.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: {
        name: s.name,
        department: s.dept,
        type: 'principal' as const,
        capacity: 'N/A',
        contact: 'N/A',
        source: 'Données locales (fallback)',
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        source: 'Données locales (fallback)',
        count: features.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private empty(): SdisCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'OpenStreetMap (Overpass)',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export default new SdisService();
