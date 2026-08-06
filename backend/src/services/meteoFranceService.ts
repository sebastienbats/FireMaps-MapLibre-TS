import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { WindCollection, WindPointFeature } from '../types';

const cache = new NodeCache({ stdTTL: 600 }); // Cache 10 minutes

// ✅ Open-Meteo API — proxy des données Météo-France AROME/ARPEGE
// ✅ Pas de clé API requise pour usage non commercial
// ✅ 10 000 appels/jour gratuit
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/meteofrance';

// ✅ Grille de points couvrant la France métropolitaine
const FRANCE_GRID: Array<{ lat: number; lon: number; name: string }> = [
  { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  { lat: 43.2965, lon: 5.3698, name: 'Marseille' },
  { lat: 45.7640, lon: 4.8357, name: 'Lyon' },
  { lat: 44.8378, lon: -0.5792, name: 'Bordeaux' },
  { lat: 43.6047, lon: 1.4442, name: 'Toulouse' },
  { lat: 47.2184, lon: -1.5536, name: 'Nantes' },
  { lat: 48.5734, lon: 7.7521, name: 'Strasbourg' },
  { lat: 45.1885, lon: 5.7245, name: 'Grenoble' },
  { lat: 42.6987, lon: 2.8956, name: 'Perpignan' },
  { lat: 49.2583, lon: 4.0317, name: 'Reims' },
  { lat: 47.3220, lon: -0.5496, name: 'Angers' },
  { lat: 43.6108, lon: 3.8767, name: 'Montpellier' },
];

class MeteoFranceService {
  /**
   * ✅ Récupère les données de vent via Open-Meteo API
   * Source : Météo-France AROME/ARPEGE via proxy Open-Meteo
   * Auth : ❌ Aucune clé requise
   */
  async getWindData(): Promise<WindCollection> {
    const cached = cache.get<WindCollection>('meteo_wind');
    if (cached) return cached;

    try {
      // ✅ Requêtes parallèles sur la grille avec Promise.allSettled
      const requests = FRANCE_GRID.map(point =>
        axios.get(OPEN_METEO_URL, {
          params: {
            latitude: point.lat,
            longitude: point.lon,
            hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
            wind_speed_unit: 'kmh',
            timezone: 'Europe/Paris',
            forecast_days: 1,
          },
          timeout: 10_000,
        })
          .then(res => this.extractWind(res.data, point.lon, point.lat))
          .catch(err => {
            logger.warn(`[Open-Meteo] Erreur point ${point.name}: ${err.message}`);
            return null;
          })
      );

      const results = await Promise.allSettled(requests);
      const features: WindPointFeature[] = results
        .filter((r): r is PromiseFulfilledResult<WindPointFeature | null> => 
          r.status === 'fulfilled')
        .map(r => r.value)
        .filter((f): f is WindPointFeature => f !== null);

      const result: WindCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'Météo-France (via Open-Meteo)',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set('meteo_wind', result);
      logger.info(`[Open-Meteo] ${features.length}/${FRANCE_GRID.length} points vent`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(`[Open-Meteo] Erreur globale: ${msg}`);
      return this.emptyWind();
    }
  }

  /**
   * ✅ Extrait les données de vent depuis la réponse Open-Meteo
   */
  private extractWind(
    data: {
      hourly?: {
        time?: string[];
        wind_speed_10m?: number[];
        wind_direction_10m?: number[];
        wind_gusts_10m?: number[];
      };
    },
    lon: number,
    lat: number
  ): WindPointFeature | null {
    const hourly = data.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) return null;

    // Prendre la première heure disponible
    const windSpeed = hourly.wind_speed_10m?.[0] || 0;
    const windDirection = hourly.wind_direction_10m?.[0] || 0;
    const windGust = hourly.wind_gusts_10m?.[0];

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        speed: windSpeed,
        direction: windDirection,
        gust: windGust,
        source: 'Météo-France (AROME)',
      },
    };
  }

  private emptyWind(): WindCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'Météo-France (via Open-Meteo)',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export default new MeteoFranceService();
