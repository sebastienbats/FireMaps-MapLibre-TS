import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { SdisCollection, SdisFeature, SdisTypeValue } from '../types';

const cache = new NodeCache({ stdTTL: 86_400 }); // Cache 24h

// ✅ Overpass API (OpenStreetMap) — source réelle et gratuite
// Pas de clé API requise, pas d'inscription
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Serveur miroir pour fallback
const OVERPASS_MIRROR_URL = 'https://overpass.kumi.systems/api/interpreter';

class SdisService {
  /**
   * ✅ Récupère les casernes de pompiers depuis OpenStreetMap via Overpass API
   * Remplace l'endpoint inventé geo.api.gouv.fr/sdis
   *
   * Source réelle : https://overpass-api.de/
   * Tag OSM : amenity=fire_station
   * Pas de clé API requise
   */
  async getAll(): Promise<SdisCollection> {
    const cached = cache.get<SdisCollection>('sdis_all');
    if (cached) return cached;

    // Essayer le serveur principal, puis le miroir
    const servers = [OVERPASS_URL, OVERPASS_MIRROR_URL];

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
        logger.warn(`[SDIS] Erreur serveur ${server}: ${msg}`);
      }
    }

    logger.warn('[SDIS] Tous les serveurs Overpass ont échoué, retour vide');
    return this.empty();
  }

  private async fetchFromOverpass(serverUrl: string): Promise<SdisCollection> {
    // ✅ Requête Overpass pour les casernes de pompiers en France
    const query = `
      [out:json][timeout:60];
      area["name"="France métropolitaine"]["boundary"="administrative"]->.france;
      (
        node["amenity"="fire_station"](area.france);
        way["amenity"="fire_station"](area.france);
        relation["amenity"="fire_station"](area.france);
      );
      out center tags;
    `;

    const res = await axios.post(
      serverUrl,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FireMaps/4.1',
        },
        timeout: 90_000,
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
    type: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }): SdisFeature {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lon = el.lon ?? el.center?.lon ?? 0;
    const tags = el.tags || {};

    // Déterminer le type de caserne
    const type: SdisTypeValue =
      tags.fire_station === 'wildfire' || tags.emergency === 'fire_station'
        ? 'secondaire'
        : 'principal';

    // Extraire le département du tag addr:department ou de l'adresse
    const department = tags['addr:department'] || tags['addr:province'] || '';

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        name: tags.name || tags.operator || 'Caserne de pompiers',
        department,
        type,
        capacity: tags.capacity || 'N/A',
        contact: tags.phone || tags['contact:phone'] || 'N/A',
        source: 'OpenStreetMap',
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
