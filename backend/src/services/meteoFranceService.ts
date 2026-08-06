import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../config/logger';
import type { WindCollection, WindPointFeature, MeteoFranceToken } from '../types';

const cache = new NodeCache({ stdTTL: 600 });

// ✅ URL réelle de l'API Météo-France
const METEO_API_URL = 'https://api.meteo-france.com/v1';

// ✅ URL d'authentification OAuth2
// Note : vérifier l'URL exacte après inscription sur https://api.meteo-france.com/
const OAUTH_TOKEN_URL = 'https://api.meteo-france.com/oauth/token';

// ✅ Grille de points couvrant la France métropolitaine
// Pas d'endpoint /wind dédié : on extrait le vent depuis /forecast
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
   * ✅ Récupère les données de vent pour une grille de points sur la France
   * Utilise l'endpoint réel /v1/forecast (pas /v1/wind qui n'existe pas)
   */
  async getWindData(): Promise<WindCollection> {
    const cached = cache.get<WindCollection>('meteo_wind');
    if (cached) return cached;

    const apiKey = process.env.METEO_FRANCE_API_KEY;
    const apiSecret = process.env.METEO_FRANCE_API_SECRET;

    if (!apiKey || !apiSecret) {
      logger.warn('[Météo-France] Clés API manquantes, retour vide');
      return this.emptyWind();
    }

    try {
      const token = await this.getAccessToken(apiKey, apiSecret);

      // ✅ Requêtes parallèles sur la grille avec Promise.allSettled
      // pour ne pas bloquer si un point échoue
      const requests = FRANCE_GRID.map(point =>
        axios.get(`${METEO_API_URL}/forecast`, {
          params: {
            lat: point.lat,
            lon: point.lon,
            // ✅ Token en header, PAS en query string
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          timeout: 10_000,
        })
          .then(res => this.extractWind(res.data, point.lon, point.lat))
          .catch(err => {
            logger.warn(`[Météo-France] Erreur point ${point.name}: ${err.message}`);
            return null;
          })
      );

      const results = await Promise.allSettled(requests);
      const features: WindPointFeature[] = results
        .filter((r): r is PromiseFulfilledResult<WindPointFeature | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((f): f is WindPointFeature => f !== null);

      const result: WindCollection = {
        type: 'FeatureCollection',
        features,
        metadata: {
          source: 'Météo-France',
          count: features.length,
          generatedAt: new Date().toISOString(),
        },
      };

      cache.set('meteo_wind', result);
      logger.info(`[Météo-France] ${features.length}/${FRANCE_GRID.length} points vent`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(`[Météo-France] Erreur globale: ${msg}`);
      return this.emptyWind();
    }
  }

  /**
   * ✅ Authentification OAuth2 — client_credentials
   * Le token est ensuite passé en header Authorization: Bearer
   */
  private async getAccessToken(apiKey: string, apiSecret: string): Promise<string> {
    try {
      const res = await axios.post<MeteoFranceToken>(
        OAUTH_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: apiSecret,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10_000,
        }
      );
      return res.data.access_token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(`[Météo-France] Erreur authentification: ${msg}`);
      throw new Error('Échec authentification Météo-France');
    }
  }

  /**
   * ✅ Extrait les données de vent depuis la réponse /v1/forecast
   * Structure réelle : { forecast: { "2026-08-06T13:00:00Z": { T: { wind_speed, wind_direction, wind_gust } } } }
   */
  private extractWind(
    data: Record<string, unknown>,
    lon: number,
    lat: number
  ): WindPointFeature | null {
    const forecast = data.forecast as Record<string, Record<string, Record<string, number>>> | undefined;
    if (!forecast) return null;

    // Prendre la première prévision disponible
    const timestamps = Object.keys(forecast);
    if (timestamps.length === 0) return null;

    const firstTimestamp = timestamps[0];
    const weatherData = forecast[firstTimestamp];
    if (!weatherData) return null;

    // Les données de vent sont dans la clé "T" (température/vent)
    const windData = weatherData.T;
    if (!windData) return null;

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        speed: windData.wind_speed || 0,
        direction: windData.wind_direction || 0,
        gust: windData.wind_gust,
        source: 'Météo-France',
      },
    };
  }

  private emptyWind(): WindCollection {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        source: 'Météo-France',
        count: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

export default new MeteoFranceService();
